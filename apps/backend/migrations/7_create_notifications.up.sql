-- notifications: per-user event feed for the governance layer.
-- Every significant state change (proposal submitted/accepted/rejected, comment posted,
-- conflict detected) inserts a notification row for each affected user.
-- The deliberation record is sealed when a proposal is accepted or rejected.
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,  -- 'proposal_submitted', 'proposal_accepted',
                                --  'proposal_rejected', 'comment_posted', 'conflict_detected'
    payload     JSONB NOT NULL DEFAULT '{}',
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, read) WHERE NOT read;
