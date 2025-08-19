
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCart } from '@/context/cart-context';

const uploadFile = async (file: File, applicationId: string, fileType: string): Promise<string> => {
    const storageRef = ref(storage, `kisan-jaivik-card-applications/${applicationId}/${fileType}-${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    return getDownloadURL(uploadResult.ref);
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        
        const searchParams = request.nextUrl.searchParams;
        const applicationId = searchParams.get('applicationId');
        const applicationType = searchParams.get('type');

        if (!applicationId || !applicationType || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment details' }, { status: 400 });
        }

        // 1. Verify the signature
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            throw new Error('Razorpay secret key is not configured.');
        }

        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');
            
        let collectionName = '';
        let redirectUrl = '';
        
        switch(applicationType) {
            case 'coordinator':
                collectionName = 'coordinator-applications';
                redirectUrl = `/application-confirmation?id=${applicationId}`;
                break;
            case 'kisan-card':
                collectionName = 'kisan-jaivik-card-applications';
                redirectUrl = `/application-confirmation?id=${applicationId}`;
                break;
            case 'order':
                collectionName = 'orders';
                redirectUrl = `/order-confirmation?id=${applicationId}`;
                break;
            default:
                 return NextResponse.redirect(new URL('/?error=invalid_application_type', request.url));
        }
            
        if (generated_signature !== razorpay_signature) {
            // Payment failed, update status to 'payment_failed'
            const docRef = doc(db, collectionName, applicationId);
            await updateDoc(docRef, { 
                status: 'payment_failed',
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature
             });
            return NextResponse.redirect(new URL('/?error=payment_verification_failed', request.url));
        }

        // 2. Payment is successful, update the document status
        const docRef = doc(db, collectionName, applicationId);
        const newStatus = applicationType === 'order' ? 'Pending' : 'Received';
        
        await updateDoc(docRef, {
            status: newStatus,
            paymentId: razorpay_payment_id, // Save payment ID
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        });

        // 3. If it's a product order, update stock
        if(applicationType === 'order') {
            const orderSnap = await getDoc(docRef);
            if(orderSnap.exists()){
                const orderData = orderSnap.data();
                if(orderData.items && Array.isArray(orderData.items)){
                     for (const item of orderData.items) {
                        const productRef = doc(db, 'products', item.id);
                        const productSnap = await getDoc(productRef);
                        if (productSnap.exists()) {
                            const currentStock = productSnap.data().stock || 0;
                            const newStock = Math.max(0, currentStock - item.quantity);
                            await updateDoc(productRef, { stock: newStock });
                        }
                    }
                }
            }
        }

        // 4. Redirect to a confirmation page
        return NextResponse.redirect(new URL(redirectUrl, request.url));

    } catch (error: any) {
        console.error("Verification Error:", error);
        return NextResponse.redirect(new URL('/?error=verification_server_error', request.url));
    }
}
