
"use client"

import { motion, Variants } from 'framer-motion';

export const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

export const staggeredListVariants: Variants = {
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
    hidden: {},
};

export const staggeredItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

interface MotionWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export function MotionWrapper({ children, className }: MotionWrapperProps) {
    return (
        <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
