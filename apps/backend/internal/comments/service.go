package comments

import (
	"context"
	"fmt"
	"strings"

	"granth/internal/proposals"
	"granth/internal/utils"
)

// proposalIsOpen fetches the proposal and returns an error if it is not open.
// A non-open proposal has a sealed deliberation record.
func proposalIsOpen(proposalID string, ctx context.Context) error {
	p, err := proposals.GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
	}
	if p.State != "open" {
		return fmt.Errorf("deliberation is sealed; this proposal has already been decided")
	}
	return nil
}

// listComments returns all comments for a proposal. No permission restriction —
// any authenticated user may read the reasoning layer of any proposal.
func listComments(proposalID string, ctx context.Context) ([]*Comment, error) {
	comments, err := FetchCommentsByProposal(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error listing comments: %w", err)
	}
	return comments, nil
}

// createComment posts a new top-level comment or reply to a proposal.
// The proposal must be open (deliberation is not sealed).
func createComment(proposalID string, parentID *string, body string, ctx context.Context) (*Comment, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	if strings.TrimSpace(body) == "" {
		return nil, fmt.Errorf("comment body cannot be empty")
	}

	if err := proposalIsOpen(proposalID, ctx); err != nil {
		return nil, err
	}

	// If this is a reply, verify the parent comment exists and belongs to the same proposal.
	if parentID != nil {
		parent, err := FetchCommentByID(*parentID, ctx)
		if err != nil {
			return nil, fmt.Errorf("parent comment not found")
		}
		if parent.ProposalID != proposalID {
			return nil, fmt.Errorf("parent comment does not belong to this proposal")
		}
	}

	c := &Comment{
		ProposalID: proposalID,
		AuthorID:   userID,
		ParentID:   parentID,
		Body:       strings.TrimSpace(body),
	}

	if err := CreateComment(c, ctx); err != nil {
		return nil, fmt.Errorf("error creating comment: %w", err)
	}

	return c, nil
}

// editComment updates the body of an existing comment.
// Only the comment's author may edit, and only while the proposal is still open.
func editComment(commentID, body string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	if strings.TrimSpace(body) == "" {
		return fmt.Errorf("comment body cannot be empty")
	}

	c, err := FetchCommentByID(commentID, ctx)
	if err != nil {
		return err
	}

	if c.AuthorID != userID {
		return fmt.Errorf("only the comment author can edit or delete this comment")
	}

	if err := proposalIsOpen(c.ProposalID, ctx); err != nil {
		return err
	}

	return UpdateCommentBody(commentID, strings.TrimSpace(body), ctx)
}

// deleteComment removes a comment. Only the author may delete their own comment,
// the proposal must still be open, and the comment must have no replies.
func deleteComment(commentID string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	c, err := FetchCommentByID(commentID, ctx)
	if err != nil {
		return err
	}

	if c.AuthorID != userID {
		return fmt.Errorf("only the comment author can edit or delete this comment")
	}

	if err := proposalIsOpen(c.ProposalID, ctx); err != nil {
		return err
	}

	replies, err := CountReplies(commentID, ctx)
	if err != nil {
		return err
	}
	if replies > 0 {
		return fmt.Errorf("cannot delete a comment that has replies")
	}

	return DeleteComment(commentID, ctx)
}
