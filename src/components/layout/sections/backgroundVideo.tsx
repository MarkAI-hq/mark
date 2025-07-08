// "use client";

// import { motion, useScroll, useTransform } from "framer-motion";
// import { useRef, useEffect, useState } from "react";
// import React from "react";

// const BackgroundVideo: React.FC = () => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [leftVideoTime, setLeftVideoTime] = useState(0);
//   const [rightVideoTime, setRightVideoTime] = useState(0);

//   // Watch scroll over the container
//   const { scrollYProgress } = useScroll({
//     target: containerRef,
//     offset: ["start end", "end start"], // when container is entering and leaving viewport
//   });

//   // 1. Zoom video horizontally
//   const scaleX = useTransform(scrollYProgress, [0, 1], [1, 1.5]);

//   // 2. Move videos apart
//   const splitDistance = useTransform(scrollYProgress, [0.5, 1], [0, 300]);
//   const splitLeft = useTransform(splitDistance, (v) => `-${v}px`);
//   const splitRight = useTransform(splitDistance, (v) => `${v}px`);

//   // 3. Fade background color
//   const backgroundOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

//   // 4. Animate text opacity + movement
//   const textOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1]);
//   const textTranslateY = useTransform(scrollYProgress, [0.7, 1], [50, 0]);

//   // Adjust video playback based on scroll progress
//   useEffect(() => {
//     const unsubscribe = scrollYProgress.onChange((v) => {
//       const time = v * 10; // Control playback based on scroll progress
//       setLeftVideoTime(time);
//       setRightVideoTime(time);
//     });
//     return () => unsubscribe();
//   }, [scrollYProgress]);

//   return (
//     <section ref={containerRef} className="relative w-full h-[300vh] bg-black">
//       {/* Sticky wrapper */}
//       <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
//         {/* Background Fade */}
//         <motion.div
//           style={{
//             opacity: backgroundOpacity,
//           }}
//           className="absolute inset-0 bg-black z-10"
//         />

//         {/* Left Video */}
//         <motion.video
//           src="https://framerusercontent.com/assets/89igYAlSCbjP1wZuNZ1Qa7fcnQ.mp4"
//           loop
//           muted
//           playsInline
//           autoPlay
//           preload="auto"
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "50%",
//             height: "100%",
//             objectFit: "cover",
//             borderRadius: "0px 0px 0px 90px",
//             objectPosition: "left center",
//             scaleX: scaleX,
//             x: splitLeft,
//           }}
//           className="z-0"
//           currentTime={leftVideoTime}
//         />

//         {/* Right Video */}
//         <motion.video
//           src="https://framerusercontent.com/assets/89igYAlSCbjP1wZuNZ1Qa7fcnQ.mp4"
//           loop
//           muted
//           playsInline
//           autoPlay
//           preload="auto"
//           style={{
//             position: "absolute",
//             top: 0,
//             right: 0,
//             width: "50%",
//             height: "100%",
//             objectFit: "contain",
//             borderRadius: "0px 0px 90px 0px",
//             objectPosition: "right center",
//             scaleX: scaleX,
//             x: splitRight,
//           }}
//           className="z-0"
//           currentTime={rightVideoTime}
//         />

//         {/* Text Layer */}
//         <motion.div
//           style={{
//             opacity: textOpacity,
//             y: textTranslateY,
//           }}
//           className="z-20 text-white text-center"
//         >
//           <h1 className="text-5xl md:text-7xl font-bold">Our Mission</h1>
//           <p className="mt-6 text-xl max-w-2xl mx-auto">
//             We build AI to power human creativity, making the impossible simple.
//           </p>
//         </motion.div>
//       </div>
//     </section>
//   );
// };

// export default BackgroundVideo;
