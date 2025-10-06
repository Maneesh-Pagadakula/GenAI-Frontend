import { createContext, useState, useContext } from "react";

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [uploadFlag, setUploadFlag] = useState("");

  return (
    <UploadContext.Provider value={{ uploadFlag, setUploadFlag }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
