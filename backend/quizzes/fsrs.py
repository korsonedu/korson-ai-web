import math
from datetime import datetime, timedelta
from django.utils import timezone

class FSRS:
    """
    FSRS (Free Spaced Repetition Scheduler) v4.5 核心算法实现
    """
    # 默认参数 (w weights)
    w = [
        0.4, 0.6, 2.4, 5.8,  # initial_stability for rating 1-4
        4.93, 0.94, 0.86, 0.01, # difficulty calculation
        1.49, 0.14, 0.94,    # stability calculation (review)
        2.18, 0.05, 0.34, 1.26, 0.29, 2.61 # stability calculation (lapse/recall)
    ]

    @classmethod
    def update_status(cls, status, rating):
        """
        根据评级更新用户题目状态
        rating: 1(Forgot/Again), 3(Remembered/Good) - 简化版只用这两个，或者扩展
        """
        now = timezone.now()
        
        # 确保 rating 在 1-4 之间
        rating = max(1, min(4, rating))

        if status.reps == 0:
            # === 初始学习 (Initial Learning) ===
            status.stability = cls.w[rating - 1]
            status.difficulty = cls.w[4] - (rating - 3) * cls.w[5]
            status.difficulty = max(1, min(10, status.difficulty))
            status.reps = 1
        else:
            # === 复习 (Review) ===
            if not status.last_review:
                status.last_review = now # Should not happen but safe guard
            
            elapsed_days = (now - status.last_review).days
            elapsed_days = max(0, elapsed_days)
            
            # 计算当前留存率 (Retrievability)
            r = math.pow(1 + 19/81 * elapsed_days / status.stability, -0.5)
            
            # 更新难度 (Difficulty)
            status.difficulty -= cls.w[6] * (rating - 3)
            # Mean reversion (w[7] is mean reversion factor, usually small like 0.01? No, formula is different)
            # FSRS v4.5: D' = D - w6 * (R - 3)
            # Then mean reversion: D' = w7 * D0(3) + (1 - w7) * D'
            # D0(3) = w4 = 4.93
            status.difficulty = cls.w[7] * cls.w[4] + (1 - cls.w[7]) * status.difficulty
            status.difficulty = max(1, min(10, status.difficulty))
            
            # 更新稳定性 (Stability)
            if rating == 1: # Forgot
                # S' = w11 * D^-w12 * ((S + 1)^w13 - 1) * e^(w14 * (1 - R))
                status.stability = cls.w[11] * math.pow(status.difficulty, -cls.w[12]) * (math.pow(status.stability + 1, cls.w[13]) - 1) * math.exp(cls.w[14] * (1 - r))
                status.lapses += 1
            else: # Recall (Rating 3 or 4)
                # Hard (2) logic omitted for simplification as we mostly have Right/Wrong
                # S' = S * (1 + e^w8 * (11 - D) * S^-w9 * (e^(w10 * (1 - R)) - 1))
                # For Good (3):
                status.stability = status.stability * (1 + math.exp(cls.w[8]) * (11 - status.difficulty) * math.pow(status.stability, -cls.w[9]) * (math.exp(cls.w[10] * (1 - r)) - 1))
            
            status.reps += 1

        status.last_review = now
        
        # 计算下一次复习间隔 (Next Interval)
        # Target Retention = 0.9
        # I = S * 9 * (1/R - 1) -> I = S * (9 * (1/0.9 - 1)) = S * 1
        # Wait, if R=0.9, (1/0.9 - 1) = 0.111. 9 * 0.111 = 1. So Interval = Stability.
        interval = status.stability
        interval = max(1, round(interval))
        
        status.next_review_at = now + timedelta(days=interval)
        return status
