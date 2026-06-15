import { createAccessControl } from "better-auth/plugins";

const statement = {
	agent: ["view", "configure"],
	tool: ["view", "configure"],
	run: ["view"],
	approval: ["review"],
	policy: ["view", "configure"],
	audit: ["view"],
	organization: ["settings"],
	connector: ["configure"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
	agent: ["view", "configure"],
	tool: ["view", "configure"],
	run: ["view"],
	approval: ["review"],
	policy: ["view", "configure"],
	audit: ["view"],
	organization: ["settings"],
	connector: ["configure"],
});

export const admin = ac.newRole({
	agent: ["view", "configure"],
	tool: ["view", "configure"],
	run: ["view"],
	approval: ["review"],
	policy: ["view", "configure"],
	audit: ["view"],
	organization: ["settings"],
	connector: ["configure"],
});

export const reviewer = ac.newRole({
	run: ["view"],
	approval: ["review"],
	audit: ["view"],
	tool: ["view"],
});

export const viewer = ac.newRole({
	run: ["view"],
	audit: ["view"],
	tool: ["view"],
});

export const roles = {
	owner,
	admin,
	reviewer,
	viewer,
};
