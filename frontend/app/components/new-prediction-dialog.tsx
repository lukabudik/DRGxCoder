'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, FileText, X } from 'lucide-react';
import styles from './new-prediction-dialog.module.css';

interface NewPredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPredictionDialog({ open, onOpenChange }: NewPredictionDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const predictMutation = useMutation({
    mutationFn: async (file: File) => {
      // Read XML file content
      const xmlContent = await file.text();
      // Send raw XML to backend for parsing
      return api.predictFromXml(xmlContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Prediction failed:', error);
    },
  });

  const handleFileSelect = (file: File) => {
    if (file && file.name.endsWith('.xml')) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid XML file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onSubmit = () => {
    if (selectedFile) {
      predictMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>New Prediction</DialogTitle>
        </DialogHeader>

        <div className={styles.content}>
          <p className={styles.description}>
            Upload an XML file from your medical system to generate AI-powered diagnosis code predictions.
          </p>

          {!selectedFile ? (
            <div
              className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={styles.uploadIcon} size={48} />
              <p className={styles.dropzoneText}>
                <span className={styles.dropzoneHighlight}>Click to upload</span> or drag and drop
              </p>
              <p className={styles.dropzoneHint}>XML files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className={styles.fileInput}
              />
            </div>
          ) : (
            <div className={styles.selectedFile}>
              <div className={styles.fileInfo}>
                <FileText size={24} className={styles.fileIcon} />
                <div className={styles.fileDetails}>
                  <p className={styles.fileName}>{selectedFile.name}</p>
                  <p className={styles.fileSize}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className={styles.removeButton}
                disabled={predictMutation.isPending}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {predictMutation.isPending && (
            <div className={styles.processingNote}>
              <p>Processing prediction... This will take approximately 2 minutes.</p>
              <p className={styles.processingHint}>You can close this modal and continue working.</p>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={predictMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              isLoading={predictMutation.isPending}
              disabled={!selectedFile || predictMutation.isPending}
            >
              {predictMutation.isPending ? 'Processing...' : 'Generate Prediction'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
