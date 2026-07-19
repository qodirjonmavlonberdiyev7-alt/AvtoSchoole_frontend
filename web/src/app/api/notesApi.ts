import { api } from './baseApi';

export interface Note {
  id: string;
  teacherId: string;
  title: string | null;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/** Note photos are served as static files outside the /api prefix - see main.ts / NotesController. */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api\/?$/, '');

export function getNoteImageUrl(filename: string): string {
  return `${API_ORIGIN}/uploads/notes/${filename}`;
}

export const notesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myNotes: builder.query<Note[], void>({
      query: () => '/notes/my',
      providesTags: ['Note'],
    }),
    createNote: builder.mutation<Note, FormData>({
      query: (body) => ({ url: '/notes', method: 'POST', body }),
      invalidatesTags: ['Note'],
    }),
    updateNote: builder.mutation<Note, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/notes/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Note'],
    }),
    deleteNote: builder.mutation<void, string>({
      query: (id) => ({ url: `/notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Note'],
    }),
  }),
});

export const { useMyNotesQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } = notesApi;
