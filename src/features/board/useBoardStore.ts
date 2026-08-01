import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialBoardPosts, type BoardCategory, type BoardPost } from './boardModel';

type NewBoardPost = Pick<BoardPost, 'title' | 'content' | 'authorId' | 'authorName'> & { category: BoardCategory };

interface BoardState {
  posts: BoardPost[];
  addPost: (post: NewBoardPost) => BoardPost;
  incrementViews: (postId: string) => void;
}

export const useBoardStore = create<BoardState>()(persist((set) => ({
  posts: initialBoardPosts,
  addPost: (input) => {
    const post: BoardPost = {
      ...input,
      id: `board-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      createdAt: new Date().toISOString(),
      views: 0,
      pinned: false,
      attachmentCount: 0,
    };
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },
  incrementViews: (postId) => set((state) => ({ posts: state.posts.map((post) => post.id === postId ? { ...post, views: post.views + 1 } : post) })),
}), { name: 'concost-board-posts-v1' }));
