import React, { useState, useEffect } from 'react';
import { Search, Plus, Share2, Edit3, Trash2, Heart, Star, X, Check, Copy } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8081/api';

const NotesApp = () => {
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModal, setShareModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      showNotification('Failed to load notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Create or update note
  const saveNote = async (noteData) => {
    try {
      const url = editingNote 
        ? `${API_BASE_URL}/notes/${editingNote.id}`
        : `${API_BASE_URL}/notes`;
      
      const method = editingNote ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        await fetchNotes();
        setIsCreating(false);
        setEditingNote(null);
        showNotification(editingNote ? 'Note updated!' : 'Note created!');
      }
    } catch (error) {
      showNotification('Failed to save note', 'error');
    }
  };

  // Delete note
  const deleteNote = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== id));
        showNotification('Note deleted!');
      }
    } catch (error) {
      showNotification('Failed to delete note', 'error');
    }
  };

  // Copy share link
  const copyShareLink = (noteId) => {
    const shareUrl = `${window.location.origin}/share/${noteId}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification('Share link copied!');
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes based on search
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Heart size={20} />
            </div>
            <h1 className="logo-text">My Notes</h1>
          </div>
          
          <div className="header-controls">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <button
              onClick={() => setIsCreating(true)}
              className="new-note-btn"
            >
              <Plus size={20} />
              <span>New Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => setEditingNote(note)}
                onDelete={() => deleteNote(note.id)}
                onShare={() => setShareModal(note)}
              />
            ))}
          </div>
        )}

        {filteredNotes.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">
              <Star size={32} />
            </div>
            <h3 className="empty-title">No notes yet!</h3>
            <p className="empty-subtitle">Create your first note to get started</p>
            <button
              onClick={() => setIsCreating(true)}
              className="new-note-btn"
            >
              Create Note
            </button>
          </div>
        )}
      </main>

      {/* Note Editor Modal */}
      {(isCreating || editingNote) && (
        <NoteEditor
          note={editingNote}
          onSave={saveNote}
          onClose={() => {
            setIsCreating(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          note={shareModal}
          onClose={() => setShareModal(null)}
          onCopy={copyShareLink}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <Check size={20} />
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

// Note Card Component
const NoteCard = ({ note, onEdit, onDelete, onShare }) => {
  return (
    <div className="note-card">
      <div className="note-header">
        <h3 className="note-title">{note.title}</h3>
        <div className="note-actions">
          {note.isPublic && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="note-action-btn"
            >
              <Share2 size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="note-action-btn"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="note-action-btn"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <p className="note-content">{note.content}</p>
      
      <div className="note-footer">
        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        {note.isPublic && (
          <span className="public-badge">Public</span>
        )}
      </div>
    </div>
  );
};

// Note Editor Component
const NoteEditor = ({ note, onSave, onClose }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isPublic, setIsPublic] = useState(note?.isPublic || false);

  const handleSave = () => {
    if (title.trim()) {
      onSave({ title, content, isPublic });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {note ? 'Edit Note' : 'Create Note'}
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content">
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="modal-input"
            autoFocus
          />
          
          <textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="modal-textarea"
          />
          
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="checkbox"
            />
            <label htmlFor="isPublic" className="checkbox-label">
              Make this note public
            </label>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="btn-primary"
          >
            {note ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Share Modal Component
const ShareModal = ({ note, onClose, onCopy }) => {
  const shareUrl = `${window.location.origin}/share/${note.id}`;
  
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Share Note</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Share this public note with others using the link below:
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#f9fafb', 
            padding: '12px', 
            borderRadius: '12px',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              style={{ 
                flex: 1, 
                background: 'transparent', 
                fontSize: '0.9rem', 
                color: '#374151',
                border: 'none',
                outline: 'none'
              }}
            />
            <button
              onClick={() => onCopy(note.id)}
              style={{
                padding: '8px',
                background: '#8b5cf6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Copy size={16} />
            </button>
          </div>
          
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Only public notes can be shared. Make sure your note is set to public.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;