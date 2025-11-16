import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Rating } from "ts-fsrs";
import GradingButtons from "@/components/study-session/GradingButtons";

describe("GradingButtons", () => {
  it("should render both Forgot and Knew buttons", () => {
    render(<GradingButtons onGrade={vi.fn()} />);
    expect(screen.getByRole("button", { name: /forgot/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /knew/i })).toBeInTheDocument();
  });

  it("should display keyboard shortcuts", () => {
    render(<GradingButtons onGrade={vi.fn()} />);
    expect(screen.getByText(/1 or F/i)).toBeInTheDocument();
    expect(screen.getByText(/2 or K/i)).toBeInTheDocument();
  });

  it("should call onGrade with Rating.Again when Forgot clicked", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    render(<GradingButtons onGrade={onGrade} />);

    const forgotButton = screen.getByRole("button", { name: /forgot/i });
    await user.click(forgotButton);

    expect(onGrade).toHaveBeenCalledWith(Rating.Again);
  });

  it("should call onGrade with Rating.Good when Knew clicked", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    render(<GradingButtons onGrade={onGrade} />);

    const knewButton = screen.getByRole("button", { name: /knew/i });
    await user.click(knewButton);

    expect(onGrade).toHaveBeenCalledWith(Rating.Good);
  });

  it("should disable both buttons when disabled prop is true", () => {
    render(<GradingButtons onGrade={vi.fn()} disabled={true} />);
    const forgotButton = screen.getByRole("button", { name: /forgot/i });
    const knewButton = screen.getByRole("button", { name: /knew/i });

    expect(forgotButton).toBeDisabled();
    expect(knewButton).toBeDisabled();
  });

  it("should enable both buttons when disabled prop is false", () => {
    render(<GradingButtons onGrade={vi.fn()} disabled={false} />);
    const forgotButton = screen.getByRole("button", { name: /forgot/i });
    const knewButton = screen.getByRole("button", { name: /knew/i });

    expect(forgotButton).not.toBeDisabled();
    expect(knewButton).not.toBeDisabled();
  });

  it("should enable both buttons when disabled prop is undefined", () => {
    render(<GradingButtons onGrade={vi.fn()} />);
    const forgotButton = screen.getByRole("button", { name: /forgot/i });
    const knewButton = screen.getByRole("button", { name: /knew/i });

    expect(forgotButton).not.toBeDisabled();
    expect(knewButton).not.toBeDisabled();
  });

  it("should not call onGrade when disabled button is clicked", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    render(<GradingButtons onGrade={onGrade} disabled={true} />);

    const forgotButton = screen.getByRole("button", { name: /forgot/i });
    await user.click(forgotButton);

    expect(onGrade).not.toHaveBeenCalled();
  });
});
