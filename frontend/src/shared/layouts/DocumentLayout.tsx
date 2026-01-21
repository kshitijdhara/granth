import React from 'react';
import './DocumentLayout.scss';

interface DocumentLayoutProps {
  children: React.ReactNode;
}

const DocumentLayout: React.FC<DocumentLayoutProps> = ({ children }) => {
  return (
    <div className="document-layout">
      <div className="document-layout__container">
        {children}
      </div>
    </div>
  );
};

export default DocumentLayout;