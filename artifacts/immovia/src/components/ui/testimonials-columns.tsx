import React from "react";
import { motion } from "framer-motion";

export interface TestimonialItem {
  text: string;
  name: string;
  role: string;
  avatar: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration ?? 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...Array(2)].map((_, idx) => (
          <React.Fragment key={idx}>
            {props.testimonials.map(({ text, name, role, avatar }, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl border border-border bg-white shadow-sm shadow-primary/5 max-w-xs w-full"
              >
                <p className="text-sm text-foreground/75 leading-[1.8] italic">"{text}"</p>
                <div className="flex items-center gap-3 mt-5">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={avatar}
                      alt={name}
                      className="h-9 w-9 rounded-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground leading-tight">{name}</span>
                    <span className="text-xs text-muted-foreground leading-tight mt-0.5">{role}</span>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
