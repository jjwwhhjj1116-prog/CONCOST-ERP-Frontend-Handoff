export type BoardCategory = 'CEO' | 'NOTICE_COMPANY' | 'NOTICE_HR' | 'NOTICE_EVENT' | 'PHOTO' | 'FREE' | 'LIBRARY';

export interface BoardPost {
  id: string;
  category: BoardCategory;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  views: number;
  pinned: boolean;
  attachmentCount: number;
  image?: string;
}

export const boardCategories: Array<{ id: BoardCategory | 'ALL'; label: string; group: string }> = [
  { id: 'ALL', label: '전체 게시글', group: '전체' },
  { id: 'CEO', label: 'CEO 인사말', group: '회사' },
  { id: 'NOTICE_COMPANY', label: '전사공지', group: '공지사항' },
  { id: 'NOTICE_HR', label: '인사발령', group: '공지사항' },
  { id: 'NOTICE_EVENT', label: '경조사', group: '공지사항' },
  { id: 'PHOTO', label: '사진첩', group: '커뮤니티' },
  { id: 'FREE', label: '자유게시판', group: '커뮤니티' },
  { id: 'LIBRARY', label: '자료실', group: '자료실' },
];

export const categoryLabel = (category: BoardCategory) => boardCategories.find((item) => item.id === category)?.label ?? category;

export const initialBoardPosts: BoardPost[] = [
  {
    id: 'board-ceo-001', category: 'CEO', title: '고객이 원하는 시간에 최상의 결과를 제공하겠습니다.',
    content: 'CONCOST GROUP은 정확한 공사비 데이터와 축적된 실무 경험을 바탕으로 고객의 의사결정을 돕습니다. 서로의 전문성을 존중하며 더 나은 기준을 함께 만들어 갑시다.',
    authorId: 'demo-cc-development-001', authorName: '대표이사', createdAt: '2026-07-01T09:00:00.000Z', views: 184, pinned: true, attachmentCount: 0,
  },
  {
    id: 'board-notice-001', category: 'NOTICE_COMPANY', title: '2026년 하반기 그룹웨어 운영 정책 안내',
    content: '프로젝트, 일정, 결재 자료는 그룹웨어의 각 업무 메뉴를 기준으로 등록해 주세요. 중요 문서는 자료실에도 함께 보관합니다.',
    authorId: 'demo-cc-development-001', authorName: '경영지원본부', createdAt: '2026-07-20T01:20:00.000Z', views: 92, pinned: true, attachmentCount: 1,
  },
  {
    id: 'board-hr-001', category: 'NOTICE_HR', title: '7월 인사발령 안내',
    content: '조직 개편 및 담당 업무 변경 사항을 안내합니다. 상세 내용은 첨부된 인사발령 문서를 확인해 주세요.',
    authorId: 'demo-cc-development-001', authorName: '인사담당자', createdAt: '2026-07-18T04:30:00.000Z', views: 77, pinned: false, attachmentCount: 1,
  },
  {
    id: 'board-event-001', category: 'NOTICE_EVENT', title: '임직원 경조사 안내',
    content: '이번 주 경조사 일정을 안내합니다. 구성원 여러분의 따뜻한 관심 부탁드립니다.',
    authorId: 'demo-cc-development-001', authorName: '총무담당자', createdAt: '2026-07-16T06:10:00.000Z', views: 54, pinned: false, attachmentCount: 0,
  },
  {
    id: 'board-photo-001', category: 'PHOTO', title: 'CONCOST 기술본부 워크숍',
    content: '기술본부 워크숍 현장 사진을 공유합니다. 프로젝트 품질 기준과 협업 방식을 함께 정리했습니다.',
    authorId: 'demo-cc-development-001', authorName: '기술본부', createdAt: '2026-07-12T08:15:00.000Z', views: 68, pinned: false, attachmentCount: 8, image: '/brand/con-cost-hero.jpg',
  },
  {
    id: 'board-free-001', category: 'FREE', title: '업무 자동화 아이디어를 공유해 주세요',
    content: '반복 업무를 줄일 수 있는 아이디어나 개선 요청을 자유롭게 남겨 주세요. 검토 후 개발 백로그에 반영하겠습니다.',
    authorId: 'demo-cc-development-001', authorName: 'DX 추진팀', createdAt: '2026-07-10T02:40:00.000Z', views: 41, pinned: false, attachmentCount: 0,
  },
  {
    id: 'board-library-001', category: 'LIBRARY', title: '프로젝트 표준 보고서 양식 모음',
    content: '업무일지, 주간보고, 납품 확인서에 사용하는 최신 표준 양식을 등록했습니다.',
    authorId: 'demo-cc-development-001', authorName: '품질관리팀', createdAt: '2026-07-08T00:30:00.000Z', views: 103, pinned: true, attachmentCount: 4,
  },
];
