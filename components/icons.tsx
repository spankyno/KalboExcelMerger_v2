
import React from 'react';

export const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "w-8 h-8 text-slate-400"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

export const ExcelIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className || "w-6 h-6 text-green-600"}
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.75 22 4.09V19.91Q22 20.25 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.25 7 19.91V18H2.83Q2.5 18 2.24 17.76 2 17.5 2 17.17V6.83Q2 6.5 2.24 6.24 2.5 6 2.83 6H7V4.09Q7 3.75 7.24 3.5 7.5 3.25 7.83 3.25M7 16.5V7.5H4V16.5M12.43 15.41L10.43 12.41L12.28 9.5H14.08L12.3 12.3L14.23 15.41M15.5 15.41H17.43L19.33 12.3L17.43 9.5H15.5L17.3 12.3M9 9H11.5V7.5H9Z" />
    </svg>
);

export const DownloadIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className || "w-5 h-5 mr-2"}
        viewBox="0 0 20 20" 
        fill="currentColor"
    >
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const ResetIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className || "w-5 h-5 mr-2"}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 12M20 20l-1.5-1.5A9 9 0 003.5 12" />
    </svg>
);
