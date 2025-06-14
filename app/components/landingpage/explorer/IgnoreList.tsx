"use client";

import { useState } from 'react';
import { useComponentData } from '@/app/lib/context/ComponentDataContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Trash2, Eye, EyeOff } from 'lucide-react';

interface IgnoreListProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function IgnoreList({ isOpen, onToggle }: IgnoreListProps) {
  const { ignoredFiles, removeFromIgnoreList } = useComponentData();
  const [isExpanded, setIsExpanded] = useState(false);

  const ignoredFilesArray = Array.from(ignoredFiles);

  const handleRemoveFile = (filePath: string) => {
    removeFromIgnoreList([filePath]);
  };

  const handleClearAll = () => {
    removeFromIgnoreList(ignoredFilesArray);
  };

  if (!isOpen) {
    return (
      <div className="p-2 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-start text-xs text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <EyeOff className="w-3 h-3 mr-2" />
          Ignore List ({ignoredFilesArray.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-700 bg-gray-800">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <EyeOff className="w-4 h-4 mr-2 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-200">
            Ignore List ({ignoredFilesArray.length})
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {ignoredFilesArray.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {ignoredFilesArray.length === 0 ? (
        <div className="p-4 text-center">
          <Eye className="w-8 h-8 mx-auto text-gray-500 mb-2" />
          <p className="text-sm text-gray-400">No files ignored</p>
          <p className="text-xs text-gray-500 mt-1">
            Select files and click &quot;Add to Ignore List&quot; to hide them from the canvas
          </p>
        </div>
      ) : (
        <div className="pb-3">
          <ScrollArea className={`${isExpanded ? 'h-64' : 'h-32'} px-3`}>
            <div className="space-y-1">
              {ignoredFilesArray.map((filePath) => (
                <div
                  key={filePath}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-200 truncate">
                      {filePath.split('/').pop()}
                    </div>
                    <div className="text-xs text-gray-400 truncate" title={filePath}>
                      {filePath}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(filePath)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {ignoredFilesArray.length > 3 && (
            <>
              <Separator className="my-2 bg-gray-600" />
              <div className="px-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 