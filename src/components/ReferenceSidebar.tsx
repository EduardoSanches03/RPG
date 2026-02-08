
import React, { useState, useEffect, useRef } from 'react';
import { IconBook, IconPlus, IconTrash, IconX } from '../app/shell/icons';
import { getPDFs, savePDF, getPDF, deletePDF, type PDFMetadata } from '../services/pdfStorage';

export function ReferenceSidebar({ 
  customTrigger,
  isOpen: externalIsOpen,
  onClose
}: { 
  customTrigger?: React.ReactNode,
  isOpen?: boolean,
  onClose?: () => void
} = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;
  
  function handleOpen() {
    if (!isControlled) setInternalIsOpen(true);
  }
  
  function handleClose() {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }

  const [pdfs, setPdfs] = useState<PDFMetadata[]>([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSystem, setActiveSystem] = useState('savage_pathfinder');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadPDFs();
    }
  }, [isOpen, activeSystem]);

  async function loadPDFs() {
    try {
      setIsLoading(true);
      const list = await getPDFs(activeSystem);
      setPdfs(list);
    } catch (error) {
      console.error('Erro ao carregar PDFs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF.');
      return;
    }

    try {
      setIsLoading(true);
      await savePDF(activeSystem, file);
      await loadPDFs();
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      alert('Erro ao salvar o PDF. Verifique se há espaço disponível.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleOpenPDF(id: string, name: string) {
    try {
      setIsLoading(true);
      const blob = await getPDF(id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setSelectedPdfUrl(url);
        setSelectedPdfName(name);
      } else {
        alert('Arquivo não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCloseViewer() {
    if (selectedPdfUrl) {
      URL.revokeObjectURL(selectedPdfUrl);
      setSelectedPdfUrl(null);
      setSelectedPdfName(null);
    }
  }

  async function handleDeletePDF(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este PDF?')) return;

    try {
      await deletePDF(id);
      await loadPDFs();
    } catch (error) {
      console.error('Erro ao deletar PDF:', error);
    }
  }

  return (
    <>
      {/* Botão Flutuante (apenas se não houver trigger customizado) */}
      {!customTrigger && (
        <button
          onClick={handleOpen}
          title="Consultar Regras"
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--panel)',
            border: '1px solid var(--accent)',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            padding: '12px 8px',
            cursor: 'pointer',
            zIndex: 90,
            boxShadow: '2px 0 10px rgba(0,0,0,0.5)',
            color: 'var(--accent)',
            display: isOpen ? 'none' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IconBook size={24} />
          <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
            CONSULTA
          </span>
        </button>
      )}

      {/* Trigger Customizado */}
      {customTrigger && !isOpen && (
        <div onClick={handleOpen} style={{ display: 'contents' }}>
          {customTrigger}
        </div>
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          background: 'var(--panel)',
          borderRight: '1px solid var(--border)',
          zIndex: 100,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: 16, 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBook size={18} />
            BIBLIOTECA
          </h2>
          <button 
            className="button button--icon" 
            onClick={handleClose}
            style={{ opacity: 0.7 }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          
          {/* Seletor de Sistema (Simples por enquanto) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase' }}>
              Sistema
            </label>
            <select 
              value={activeSystem} 
              onChange={(e) => setActiveSystem(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="savage_pathfinder">Savage Pathfinder</option>
              <option value="generic">Genérico</option>
            </select>
          </div>

          {/* Lista de PDFs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--text)' }}>LIVROS & PDFs</span>
              <button 
                className="button button--ghost" 
                style={{ padding: '4px 8px', fontSize: 11 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconPlus size={12} style={{ marginRight: 4 }} />
                Adicionar
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="application/pdf"
              onChange={handleFileUpload}
            />

            {isLoading && <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>Carregando...</div>}

            {!isLoading && pdfs.length === 0 && (
              <div style={{ 
                padding: 20, 
                textAlign: 'center', 
                border: '1px dashed var(--border)', 
                borderRadius: 8, 
                color: 'var(--muted)',
                fontSize: 12 
              }}>
                Nenhum PDF adicionado.
              </div>
            )}

            {pdfs.map((pdf) => (
              <div 
                key={pdf.id}
                onClick={() => handleOpenPDF(pdf.id, pdf.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                className="pdf-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    minWidth: 24, 
                    height: 32, 
                    background: '#e74c3c', 
                    borderRadius: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 8,
                    fontWeight: 'bold'
                  }}>
                    PDF
                  </div>
                  <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pdf.name}>
                    {pdf.name}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeletePDF(pdf.id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                  }}
                  className="delete-btn"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
          Armazenamento local no navegador.
        </div>
      </div>

      {/* Modal Visualizador de PDF */}
      {selectedPdfUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: '#1a1a1a',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{selectedPdfName}</span>
            <button 
              className="button button--ghost" 
              onClick={handleCloseViewer}
              style={{ color: 'white' }}
            >
              <IconX size={20} style={{ marginRight: 6 }} />
              Fechar
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', padding: 20 }}>
            <iframe 
              src={selectedPdfUrl} 
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8, background: 'white' }} 
              title="PDF Viewer"
            />
          </div>
        </div>
      )}

      <style>{`
        .pdf-item:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: var(--accent) !important;
        }
        .pdf-item:hover .delete-btn {
          color: var(--danger) !important;
        }
        .delete-btn:hover {
          background: rgba(255, 77, 77, 0.1) !important;
        }
      `}</style>
    </>
  );
}
