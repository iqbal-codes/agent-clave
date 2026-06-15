import { sendVerificationEmail } from "@agentclave/email";

async function testEmail() {
	console.log("Testing email sending...");

	try {
		const result = await sendVerificationEmail(
			"test@example.com",
			"Test User",
			"https://runguard.dev/auth/verify?token=test123",
		);

		console.log("Email sent successfully!", result);
	} catch (error) {
		console.error("Email send failed:", error);
	}
}

testEmail();
