import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/Pagination";

describe("Pagination", () => {
  it("should not render when totalPages is 1", () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} totalCount={10} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render when totalPages is 0", () => {
    const { container } = render(<Pagination currentPage={1} totalPages={0} totalCount={0} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render pagination info correctly", () => {
    render(<Pagination currentPage={2} totalPages={5} totalCount={250} onPageChange={vi.fn()} />);
    expect(screen.getByText(/Showing page 2 of 5 \(250 total flashcards\)/)).toBeInTheDocument();
  });

  it("should disable Previous button on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} totalCount={250} onPageChange={vi.fn()} />);
    const prevButton = screen.getByRole("button", { name: /previous page/i });
    expect(prevButton).toBeDisabled();
  });

  it("should disable Next button on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} totalCount={250} onPageChange={vi.fn()} />);
    const nextButton = screen.getByRole("button", { name: /next page/i });
    expect(nextButton).toBeDisabled();
  });

  it("should enable both buttons on middle page", () => {
    render(<Pagination currentPage={3} totalPages={5} totalCount={250} onPageChange={vi.fn()} />);
    const prevButton = screen.getByRole("button", { name: /previous page/i });
    const nextButton = screen.getByRole("button", { name: /next page/i });
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("should call onPageChange with previous page when Previous clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} totalCount={250} onPageChange={onPageChange} />);

    const prevButton = screen.getByRole("button", { name: /previous page/i });
    await user.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should call onPageChange with next page when Next clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} totalCount={250} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole("button", { name: /next page/i });
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("should not call onPageChange when Previous clicked on first page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} totalCount={250} onPageChange={onPageChange} />);

    const prevButton = screen.getByRole("button", { name: /previous page/i });
    await user.click(prevButton);

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("should not call onPageChange when Next clicked on last page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={5} totalPages={5} totalCount={250} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole("button", { name: /next page/i });
    await user.click(nextButton);

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
