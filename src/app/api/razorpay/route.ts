
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';


export async function POST(request: Request) {
    try {
        // Moved initialization inside the handler
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys are not defined in environment variables.');
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        
        const { amount } = await request.json();

        if (!amount || typeof amount !== 'number') {
            return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
        }
        
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${randomBytes(4).toString('hex')}`
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
        }

        return NextResponse.json({ order }, { status: 200 });

    } catch (error: any) {
        console.error("Razorpay API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
