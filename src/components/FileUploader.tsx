import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
type FileUploaderProps  = {
    onFileUploaded: (file: File) => Promise<void>;
}
const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }: FileUploaderProps) => {
  const onDrop = useCallback(acceptedFiles => {
    onFileUploaded(acceptedFiles[0]);
  }, [onFileUploaded]);

  const {getRootProps, getInputProps} = useDropzone({ onDrop });

  return (
    <main>
      <div className='border-10 border-red w-60 h-60'{...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
      </div>
    </main>
  );
}

export default FileUploader;
