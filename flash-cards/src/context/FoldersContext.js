import React, { createContext, useState, useEffect, useCallback } from 'react';
import { foldersAPI } from '../services/apiService';

export const FoldersContext = createContext();

export const FoldersProvider = ({ children }) => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load folders from API
    const loadFolders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await foldersAPI.getFolders();
            setFolders(data || []);
        } catch (error) {
            console.error('Error loading folders:', error);
            setFolders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load folders on mount
    useEffect(() => {
        loadFolders();
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

    // Delete a folder
    const deleteFolder = async (folderId) => {
        try {
            await foldersAPI.deleteFolder(folderId);
            await loadFolders(); // Reload to reflect deletion
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
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
        for (const folder of foldersList) {
            if (folder.id === folderId) {
                return folder;
            }
            if (folder.subfolders && folder.subfolders.length > 0) {
                const found = findFolderById(folderId, folder.subfolders);
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
