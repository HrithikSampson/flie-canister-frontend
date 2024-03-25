"use client"
import { useEffect, useState } from 'react';
import Image from "next/image";
import { Actor, HttpAgent } from '@dfinity/agent';
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import FileUploader from '../components/FileUploader';
import { Ed25519KeyIdentity } from '@dfinity/identity';

const idlFactory = ({ IDL }) => {
  const FileInput = IDL.Record({
    'content': IDL.Vec(IDL.Nat8),
    'name': IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text });
  return IDL.Service({
    'get_file': IDL.Func([IDL.Text], [IDL.Vec(IDL.Nat8)], ['query']),
    'get_files': IDL.Func([], [IDL.Vec(FileInput)], ['query']),
    'upload_file': IDL.Func([FileInput], [Result], []),
  });
};

export default function Home() {
  const [fileUploaderActor, setFileUploaderActor] = useState(null);
  const [files,setFiles] = useState([]);
  useEffect(() => {
    async function initializeActor() {
      const identity = Ed25519KeyIdentity.generate();
      const agent = new HttpAgent({ host: process.env.NEXT_PUBLIC_BACKEND_URL, identity });
      await agent.fetchRootKey();
      console.log(process.env)
      const actor = Actor.createActor(idlFactory, { agent, canisterId: process.env.NEXT_PUBLIC_CAN_ID });
      setFileUploaderActor(actor);
    }
    initializeActor();
  }, []);

  const handleFileDownload = async () => {
    if (!fileUploaderActor) {
      console.error("Files get actor is not initialized.");
      return;
    }

    try {
      const response = await fileUploaderActor.get_files();
      console.log('Download response:', response);
      setFiles(response.map((fileWrapper)=>{
        const textDecoder = new TextDecoder('utf-8');
        const textContent = textDecoder.decode(new Uint8Array(fileWrapper.content));
        const blob = new Blob([textContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        return {name: fileWrapper.name, url,content: textContent};
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!fileUploaderActor) {
      console.error("File uploader actor is not initialized.");
      return;
    }
    console.log(file.type)
    const blob = new Blob([file], { type: "text/plain" });
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    try {
      const response = await fileUploaderActor.upload_file({ name: file.name, content: uint8Array });
      console.log('Upload response:', response);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1>Upload File to IC</h1>
        <div className='border-10 border-red'>
          {fileUploaderActor ? (
            <FileUploader onFileUploaded={handleFileUpload} />
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <button onClick={()=>{handleFileDownload()}}>Get Files</button>
        {files.map((fileWrapper)=>{
          return (<div key={fileWrapper.name}>
                    <div>{fileWrapper.name}</div>
                    <a href={fileWrapper.url} download={fileWrapper.name}>Download</a>
                    <div>{fileWrapper.content}</div>
                  </div>)
        })}
      </div>
    </main>
  );
}
