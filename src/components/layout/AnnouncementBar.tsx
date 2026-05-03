import React from 'react';
import { motion } from 'motion/react';
import { useProductStore } from '../../store/useProductStore';
import { Link } from 'react-router-dom';

export function AnnouncementBar() {
  const { announcement } = useProductStore();

  if (!announcement || !announcement.active || !announcement.text) return null;

  const content = (
    <div className="bg-wine-800 text-white py-2 overflow-hidden whitespace-nowrap border-y border-white/5">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 25,
          ease: "linear",
          repeat: Infinity,
        }}
        className="inline-block"
      >
        <span className="inline-block px-12 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
          {announcement.text}
        </span>
        <span className="inline-block px-12 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
          {announcement.text}
        </span>
        <span className="inline-block px-12 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
          {announcement.text}
        </span>
        <span className="inline-block px-12 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em]">
          {announcement.text}
        </span>
      </motion.div>
    </div>
  );

  if (announcement.link) {
    const isExternal = announcement.link.startsWith('http');
    if (isExternal) {
      return (
        <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
          {content}
        </a>
      );
    }
    return (
      <Link to={announcement.link} className="block cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
