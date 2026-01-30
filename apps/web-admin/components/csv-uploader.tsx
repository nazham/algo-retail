import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBulkUpload } from '../hooks/use-bulk-upload';
import { UploadCloud, FileType, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button'; // Assuming Button exists in shared UI
import { ImportReport } from './import-report';
import { cn } from '@repo/ui/lib/utils'; // Assuming utils exists

export function CSVUploader() {
  const { upload, isLoading, progress, data, error, reset } = useBulkUpload();
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      setFileError(null);

      if (!file) {
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        setFileError('File size must be less than 10MB');
        return;
      }

      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setFileError('Only CSV files are allowed');
        return;
      }

      upload(file);
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!data ? (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'relative flex flex-col items-center justify-center w-full min-h-[300px] rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden group hover:border-primary/50 hover:bg-muted/50',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 bg-background',
              isLoading ? 'pointer-events-none opacity-50' : '',
            )}
          >
            <input {...getInputProps()} />

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-4 border-muted opacity-25"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    style={{ animationDuration: '1.5s' }}
                  ></div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium text-foreground">Importing Products...</p>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                </div>
                {/* Progress Bar */}
                <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                <div className="p-4 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                  <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive ? 'Drop the CSV file here' : 'Drag & drop CSV file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">or click to select file</p>
                </div>
                <div className="flex gap-2 items-center text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-muted-foreground/10">
                  <FileType className="h-3 w-3" />
                  <span>Max 10MB</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>CSV format</span>
                </div>
              </div>
            )}
          </div>

          {(fileError || error) && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 flex items-start gap-3 mt-4 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-400">Upload Failed</p>
                <p className="text-red-700 dark:text-red-300 mt-1">{fileError || error?.message}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 bg-background rounded-xl p-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight">Import Completed</h2>
            <Button onClick={reset} variant="outline">
              Upload Another File
            </Button>
          </div>
          <ImportReport result={data} />
        </div>
      )}
    </div>
  );
}
