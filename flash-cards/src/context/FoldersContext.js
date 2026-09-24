import React, { createContext, useState, useEffect, useCallback } from 'react';
import { foldersAPI } from '../services/apiService';

export const FoldersContext = createContext();

export const FoldersProvider = ({ children }) => {
    const [folders, setFolders] = useState(() => {
        try {
            const stored = localStorage.getItem('flashcards-folders');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);

    // Load folders from API with localStorage fallback
    const loadFolders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await foldersAPI.getFolders();
            if (Array.isArray(data) && data.length > 0) {
                setFolders(data);
                localStorage.setItem('flashcards-folders', JSON.stringify(data));
            } else {
                const stored = localStorage.getItem('flashcards-folders');
                if (stored) {
                    setFolders(JSON.parse(stored));
                } else {
                    setFolders(data || []);
                }
            }
        } catch (error) {
            console.error('Error loading folders:', error);
            const stored = localStorage.getItem('flashcards-folders');
            if (stored) {
                try { setFolders(JSON.parse(stored)); } catch (_) { setFolders([]); }
            } else {
                setFolders([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load folders on mount and on visibility change
    useEffect(() => {
        loadFolders();

        let lastFoldersLoad = Date.now();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastFoldersLoad > 30000) {
                lastFoldersLoad = Date.now();
                loadFolders();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loadFolders]);

    // Create a new folder
    const createFolder = async (folderData) => {
        try {
            const newFolder = await foldersAPI.createFolder(folderData);
            await loadFolders(); // Reload to get updated hierarchy
            return newFolder;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    };

    // Update a folder
    const updateFolder = async (folderId, folderData) => {
        try {
            const updated = await foldersAPI.updateFolder(folderId, folderData);
            await loadFolders(); // Reload to get updated hierarchy
            return updated;
        } catch (error) {
            console.error('Error updating folder:', error);
            throw error;
        }
    };

    // Delete a folder (Optimistic UI update + API call)
    const deleteFolder = async (folderId) => {
        // Optimistically remove folder immediately from UI and local storage
        setFolders(prev => {
            const updated = prev.filter(f => f.id !== folderId);
            localStorage.setItem('flashcards-folders', JSON.stringify(updated));
            return updated;
        });

        try {
            await foldersAPI.deleteFolder(folderId);
        } catch (error) {
            console.warn('Backend delete folder warning, continuing with local deletion:', error.message);
        }
    };

    // Move a deck to a folder
    const moveDeckToFolder = async (folderId, deckId, order = 0) => {
        try {
            await foldersAPI.moveDeckToFolder(folderId, deckId, order);
            await loadFolders(); // Reload to reflect changes
        } catch (error) {
            console.error('Error moving deck to folder:', error);
            throw error;
        }
    };

    // Move a folder to another folder or to root (targetParentFolderId = null)
    const moveFolder = async (folderId, targetParentFolderId = null) => {
        try {
            const normalizedParentId = (targetParentFolderId === '' || targetParentFolderId === '0' || targetParentFolderId === 0)
                ? null
                : targetParentFolderId;
            const updated = await foldersAPI.updateFolder(folderId, {
                parent_folder_id: normalizedParentId
            });
            await loadFolders(); // Reload to reflect changes
            return updated;
        } catch (error) {
            console.error('Error moving folder:', error);
            throw error;
        }
    };

    // Remove a deck from folder (move to root)
    const removeDeckFromFolder = async (deckId) => {
        try {
            await foldersAPI.removeDeckFromFolder(deckId);
            await loadFolders(); // Reload to reflect changes
        } catch (error) {
            console.error('Error removing deck from folder:', error);
            throw error;
        }
    };

    // Find a folder by ID (including nested folders)
    const findFolderById = useCallback((folderId, foldersList = folders) => {
        const targetId = Number(folderId);
        for (const folder of foldersList) {
            if (Number(folder.id) === targetId) {
                return folder;
            }
            if (folder.subfolders && folder.subfolders.length > 0) {
                const found = findFolderById(targetId, folder.subfolders);
                if (found) return found;
            }
        }
        return null;
    }, [folders]);

    return (
        <FoldersContext.Provider
            value={{
                folders,
                loading,
                createFolder,
                updateFolder,
                deleteFolder,
                moveFolder,
                moveDeckToFolder,
                removeDeckFromFolder,
                loadFolders,
                findFolderById
            }}
        >
            {children}
        </FoldersContext.Provider>
    );
};
