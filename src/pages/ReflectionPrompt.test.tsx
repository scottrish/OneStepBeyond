import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../services/reflectionService", () => ({
  recordReflection: vi.fn(),
}));

import * as reflectionService from "../services/reflectionService";
import ReflectionPrompt from "./ReflectionPrompt";

const mockedService = reflectionService as unknown as {
  recordReflection: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReflectionPrompt", () => {
  it("submits immediately when the steps were about right, with no follow-up question", async () => {
    mockedService.recordReflection.mockResolvedValue(undefined);
    const onDone = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <ReflectionPrompt studentId="student-1" assignmentId="a1" onDone={onDone} />,
    );

    await userEventInstance.click(
      screen.getByRole("radio", { name: /the steps were about right/i }),
    );

    expect(mockedService.recordReflection).toHaveBeenCalledWith("student-1", {
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "The steps were about right",
      freeText: null,
      proposedAdjustment: null,
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/what would you change next time/i)).not.toBeInTheDocument();
  });

  it("asks a follow-up adjustment question after a response indicating a problem", async () => {
    mockedService.recordReflection.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <ReflectionPrompt studentId="student-1" assignmentId="a1" onDone={vi.fn()} />,
    );

    await userEventInstance.click(screen.getByRole("radio", { name: /i missed a step/i }));

    expect(screen.getByText(/what would you change next time/i)).toBeInTheDocument();
    expect(mockedService.recordReflection).not.toHaveBeenCalled();

    await userEventInstance.click(
      screen.getByRole("radio", { name: /add a step i missed/i }),
    );

    expect(mockedService.recordReflection).toHaveBeenCalledWith("student-1", {
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "I missed a step",
      freeText: null,
      proposedAdjustment: "Add a step I missed",
    });
  });

  it("skipping the adjustment question still records the primary response", async () => {
    mockedService.recordReflection.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <ReflectionPrompt studentId="student-1" assignmentId="a1" onDone={vi.fn()} />,
    );

    await userEventInstance.click(screen.getByRole("radio", { name: /some steps were too big/i }));
    await userEventInstance.click(screen.getByRole("button", { name: /skip this question/i }));

    expect(mockedService.recordReflection).toHaveBeenCalledWith("student-1", {
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "Some steps were too big",
      freeText: null,
      proposedAdjustment: null,
    });
  });

  it("skipping the primary question entirely records nothing", async () => {
    const onDone = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <ReflectionPrompt studentId="student-1" assignmentId="a1" onDone={onDone} />,
    );

    await userEventInstance.click(screen.getByRole("button", { name: /skip this question/i }));

    expect(mockedService.recordReflection).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("supports optional free text on 'Something else'", async () => {
    mockedService.recordReflection.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <ReflectionPrompt studentId="student-1" assignmentId="a1" onDone={vi.fn()} />,
    );

    await userEventInstance.click(
      screen.getAllByRole("radio", { name: /something else/i })[0],
    );
    await userEventInstance.type(
      screen.getByLabelText(/tell us more/i),
      "It was more about timing than the steps themselves.",
    );
    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
    await userEventInstance.click(screen.getByRole("radio", { name: /^nothing$/i }));

    expect(mockedService.recordReflection).toHaveBeenCalledWith("student-1", {
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "Something else",
      freeText: "It was more about timing than the steps themselves.",
      proposedAdjustment: "Nothing",
    });
  });
});
