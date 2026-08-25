import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    careerProfileUpdateSchema,
    careerStageHasExpectedProfessionalExperience,
} from "../src/lib/career-profile";

describe("Career profile", () => {
    test("supports student, freelancer, and professional scoring expectations", () => {
        assert.equal(careerStageHasExpectedProfessionalExperience("first_year_student"), false);
        assert.equal(careerStageHasExpectedProfessionalExperience("final_year_student"), false);
        assert.equal(careerStageHasExpectedProfessionalExperience("freelancer"), true);
        assert.equal(careerStageHasExpectedProfessionalExperience("professional"), true);
        assert.equal(careerStageHasExpectedProfessionalExperience(null), undefined);
    });

    test("requires bounded experience years only for professionals", () => {
        assert.equal(careerProfileUpdateSchema.safeParse({ careerStage: "third_year_student" }).success, true);
        assert.equal(careerProfileUpdateSchema.safeParse({ careerStage: "freelancer" }).success, true);
        assert.equal(careerProfileUpdateSchema.safeParse({ careerStage: "professional" }).success, false);
        assert.equal(careerProfileUpdateSchema.safeParse({ careerStage: "professional", professionalExperienceYears: 4 }).success, true);
        assert.equal(careerProfileUpdateSchema.safeParse({ careerStage: "professional", professionalExperienceYears: 61 }).success, false);
    });
});
