package comments

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"granth/internal/foundation"
)

// FetchCommentsByProposal returns all comments for a proposal, ordered by
// creation time ascending. AuthorUsername is populated via JOIN.
func FetchCommentsByProposal(proposalID string, ctx context.Context) ([]*Comment, error) {
	rows, err := foundation.PostgresDB.QueryContext(ctx,
		`SELECT c.id, c.proposal_id, c.author_id, u.username, c.parent_id,
		        c.body, c.created_at, c.updated_at
		 FROM proposal_comments c
		 INNER JOIN users u ON u.id = c.author_id
		 WHERE c.proposal_id = $1
		 ORDER BY c.created_at ASC`,
		proposalID,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying comments: %w", err)
	}
	defer rows.Close()

	var comments []*Comment
	for rows.Next() {
		c := &Comment{}
		if err := rows.Scan(
			&c.ID, &c.ProposalID, &c.AuthorID, &c.AuthorUsername,
			&c.ParentID, &c.Body, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning comment: %w", err)
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

// FetchCommentByID returns a single comment by ID, with AuthorUsername joined.
func FetchCommentByID(id string, ctx context.Context) (*Comment, error) {
	c := &Comment{}
	err := foundation.PostgresDB.QueryRowContext(ctx,
		`SELECT c.id, c.proposal_id, c.author_id, u.username, c.parent_id,
		        c.body, c.created_at, c.updated_at
		 FROM proposal_comments c
		 INNER JOIN users u ON u.id = c.author_id
		 WHERE c.id = $1`,
		id,
	).Scan(
		&c.ID, &c.ProposalID, &c.AuthorID, &c.AuthorUsername,
		&c.ParentID, &c.Body, &c.CreatedAt, &c.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("comment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("error fetching comment: %w", err)
	}
	return c, nil
}

// CreateComment inserts a new comment and populates the Comment with its
// generated ID and author_username via a CTE.
func CreateComment(c *Comment, ctx context.Context) error {
	now := time.Now().UTC().Format(time.RFC3339)
	return foundation.PostgresDB.QueryRowContext(ctx,
		`WITH ins AS (
		     INSERT INTO proposal_comments (proposal_id, author_id, parent_id, body, created_at, updated_at)
		     VALUES ($1, $2, $3, $4, $5, $5)
		     RETURNING id, proposal_id, author_id, parent_id, body, created_at, updated_at
		 )
		 SELECT ins.id, ins.proposal_id, ins.author_id, u.username,
		        ins.parent_id, ins.body, ins.created_at, ins.updated_at
		 FROM ins
		 INNER JOIN users u ON u.id = ins.author_id`,
		c.ProposalID, c.AuthorID, c.ParentID, c.Body, now,
	).Scan(
		&c.ID, &c.ProposalID, &c.AuthorID, &c.AuthorUsername,
		&c.ParentID, &c.Body, &c.CreatedAt, &c.UpdatedAt,
	)
}

// UpdateCommentBody updates the body and updated_at of a comment.
func UpdateCommentBody(id, body string, ctx context.Context) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := foundation.PostgresDB.ExecContext(ctx,
		`UPDATE proposal_comments SET body = $1, updated_at = $2 WHERE id = $3`,
		body, now, id,
	)
	if err != nil {
		return fmt.Errorf("error updating comment: %w", err)
	}
	return nil
}

// DeleteComment hard-deletes a comment by ID.
func DeleteComment(id string, ctx context.Context) error {
	_, err := foundation.PostgresDB.ExecContext(ctx,
		`DELETE FROM proposal_comments WHERE id = $1`, id,
	)
	if err != nil {
		return fmt.Errorf("error deleting comment: %w", err)
	}
	return nil
}

// CountReplies returns the number of direct replies to a comment.
// Used to guard against deleting a comment that has replies.
func CountReplies(commentID string, ctx context.Context) (int, error) {
	var count int
	err := foundation.PostgresDB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM proposal_comments WHERE parent_id = $1`,
		commentID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting replies: %w", err)
	}
	return count, nil
}
