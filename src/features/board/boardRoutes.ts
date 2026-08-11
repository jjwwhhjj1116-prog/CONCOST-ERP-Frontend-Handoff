export interface BoardListLocation {
  boardId?: string | null;
  category?: string | null;
  query?: string | null;
  filter?: string | null;
  sort?: string | null;
  page?: number | null;
  view?: string | null;
  label?: string | null;
  author?: string | null;
  from?: string | null;
  to?: string | null;
}

const queryString = (values: Record<string, string | number | null | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '' && value !== 0) params.set(key, String(value));
  });
  return params.toString();
};

export const boardListHref = (location: BoardListLocation = {}) => {
  const query = queryString({ boardId: location.boardId, category: location.category, q: location.query, filter: location.filter, sort: location.sort, page: location.page && location.page > 1 ? location.page : null, view: location.view, label: location.label, author: location.author, from: location.from, to: location.to });
  return query ? `/board?${query}` : '/board';
};

export const boardPostHref = (postId: string, returnTo?: string) => {
  const query = queryString({ postId, returnTo });
  return `/board/post?${query}`;
};

export const boardWriteHref = (boardId?: string | null) => {
  const query = queryString({ boardId });
  return query ? `/board/write?${query}` : '/board/write';
};

export const boardEditHref = (postId: string) => `/board/edit?${queryString({ postId })}`;
export const decodeBoardReturnTo = (value: string | null) => value && value.startsWith('/board') && !value.startsWith('//') ? value : '/board';
