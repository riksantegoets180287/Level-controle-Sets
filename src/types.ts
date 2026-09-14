export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface CardPair {
  id: string;
  setId: string;
  cardAText: string;
  cardBText: string;
  cardAImageUrl?: string;
  cardBImageUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardSet {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pairs?: CardPair[];
  pairCount?: number;
}

export interface PlayableCard {
  uid: string; // Unique instance ID for rendering/tracking
  pairId: string; // ID of the pair this card belongs to
  side: 'A' | 'B';
  text: string;
  imageUrl?: string;
  partnerText?: string;
}

export interface ConnectedPair {
  id: string;
  card1: PlayableCard;
  card2: PlayableCard;
}

export interface EvaluationResultItem {
  id: string;
  card1: PlayableCard;
  card2: PlayableCard;
  isCorrect: boolean;
  correctCardAText: string;
  correctCardBText: string;
}

export interface GameResult {
  setName: string;
  setSlug: string;
  completedAt: string;
  completionTime?: string;
  totalPairs: number;
  correctPairs: number;
  incorrectPairs: number;
  percentage: number;
  passed: boolean;
  items: EvaluationResultItem[];
}
