
import { cn } from "@/lib/utils";
import { Check, Truck, Package, PackageCheck, PackageX, History, ShieldQuestion } from "lucide-react";

type Status = 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered' | 'Cancellation Requested';

interface StepProps {
    status: Status;
    isCurrent: boolean;
    isCompleted: boolean;
    isFirst: boolean;
    isRejected: boolean;
}

const statusConfig: { [key in Status]: { icon: React.ReactNode, label: string } } = {
    'Pending': { icon: <History className="h-5 w-5"/>, label: 'Pending' },
    'Accepted': { icon: <Check className="h-5 w-5"/>, label: 'Accepted' },
    'Shipped': { icon: <Truck className="h-5 w-5"/>, label: 'Shipped' },
    'Delivered': { icon: <PackageCheck className="h-5 w-5"/>, label: 'Delivered' },
    'Rejected': { icon: <PackageX className="h-5 w-5"/>, label: 'Rejected' },
    'Cancellation Requested': { icon: <ShieldQuestion className="h-5 w-5" />, label: "Cancellation Request"}
}

const Step = ({ status, isCurrent, isCompleted, isFirst, isRejected }: StepProps) => {
    const { icon, label } = statusConfig[status];

    return (
        <div className="relative flex items-center">
            {!isFirst && (
                <div className={cn(
                    "absolute w-full h-0.5 -left-1/2 -right-1/2 top-1/2 -translate-y-1/2",
                    isCompleted ? "bg-primary" : "bg-border",
                    isRejected ? "bg-destructive" : ""
                )} />
            )}
            <div className="relative z-10 flex flex-col items-center">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
                    isRejected ? "bg-destructive text-destructive-foreground" :
                    isCurrent ? "bg-primary text-primary-foreground" : 
                    isCompleted ? "bg-primary/80 text-primary-foreground" : 
                    "bg-muted text-muted-foreground"
                )}>
                    {icon}
                </div>
                <p className={cn(
                    "text-xs mt-2 font-medium text-center",
                     isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>{label}</p>
            </div>
        </div>
    )
}

interface OrderStatusStepperProps {
    currentStatus: Status;
}

export function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
    const orderStatuses: Status[] = ['Pending', 'Accepted', 'Shipped', 'Delivered'];
    
    if (currentStatus === 'Rejected' || currentStatus === 'Cancellation Requested') {
        return (
             <div className="flex justify-center">
                 <Step status={currentStatus} isCurrent={true} isCompleted={true} isFirst={true} isRejected={true} />
             </div>
        )
    }

    const currentIndex = orderStatuses.indexOf(currentStatus);

    return (
        <div className="flex justify-between items-start w-full">
            {orderStatuses.map((status, index) => (
                <Step 
                    key={status}
                    status={status}
                    isCurrent={index === currentIndex}
                    isCompleted={index < currentIndex}
                    isFirst={index === 0}
                    isRejected={false}
                />
            ))}
        </div>
    )
}
