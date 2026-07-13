import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 w-2/3">
        <div className="h-4 bg-[#1b2535] rounded w-1/3"></div>
        <div className="h-6 bg-[#1b2535] rounded w-3/4"></div>
      </div>
      <div className="h-8 bg-[#1b2535] rounded-full w-16"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-6 bg-[#1b2535] rounded w-20"></div>
      <div className="h-6 bg-[#1b2535] rounded w-24"></div>
    </div>
    <div className="h-10 bg-[#1b2535] rounded w-full mt-4"></div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-[#131a26] border-b border-[#232d3f] animate-pulse">
    <div className="space-y-2 w-1/3">
      <div className="h-4 bg-[#1b2535] rounded w-3/4"></div>
      <div className="h-3 bg-[#1b2535] rounded w-1/2"></div>
    </div>
    <div className="h-6 bg-[#1b2535] rounded w-20"></div>
    <div className="h-6 bg-[#1b2535] rounded w-16"></div>
  </div>
);
