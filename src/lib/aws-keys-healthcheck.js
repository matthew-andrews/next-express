const AWS = require('aws-sdk');

const INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

let inUseExpiredKey = false;
let notInUseExpiredKey = false;

let inUseExpiredKeyUsers = [];
let notInUseExpiredKeyUsers = [];
let deletedKeys = [];

let lastUpdated = null;

function findKeyName (value) {
	return Object.keys(process.env).find(key => process.env[key] === value);
}

function checkAwsKeys () {
	const secretKeyNames = [];
	lastUpdated = new Date().toISOString();

	Object.keys(process.env).forEach(keyName => {
		const keyValue = process.env[keyName];

		if (/^[A-Za-z0-9/\\\\+=]{40}$/.test(keyValue)) {
			secretKeyNames.push(keyName);
		}
	});

	const awsKeyPairs = [];

	Object.keys(process.env).forEach(keyName => {
		const keyValue = process.env[keyName];

		if (/^[A-Z0-9]{20}$/.test(keyValue)) {
			const prefixMatch = keyName.match(/^([^_]+)[A-Za-z0-9_]+$/);
			if (prefixMatch) {
				const namePrefix = prefixMatch[1];
				let secretKeyName;

				secretKeyNames.forEach(keyName2 => {
					if (!secretKeyName && keyName !== keyName2) {
						if (new RegExp('^' + namePrefix + '_[A-Za-z0-9_]+').test(keyName2)) {
							secretKeyName = keyName2;
						}
					}
				});

				if (secretKeyName) {
					const secretKeyValue = process.env[secretKeyName];

					awsKeyPairs.push({
						accessKey: keyValue,
						secretKey: secretKeyValue
					});
				}
			}
		}
	});

	awsKeyPairs.forEach(keyPair => {
		const iam = new AWS.IAM({
			accessKeyId: keyPair.accessKey,
			secretAccessKey: keyPair.secretKey
		});

		iam.listAccessKeys({}, (err, data) => {
			if (err && err.name === 'InvalidClientTokenId') {
				const keyName = findKeyName(keyPair.accessKey);
				deletedKeys = [...deletedKeys, keyName];
			}
			if (!err) {
				if (data && data.AccessKeyMetadata) {
					data.AccessKeyMetadata.forEach(keyMetadata => {
						if (
							new Date().getTime() - new Date(keyMetadata.CreateDate).getTime() >
							90 * 24 * 60 * 60 * 1000
						) {
							if (keyMetadata.AccessKeyId === keyPair.accessKey) {
								inUseExpiredKey = true;
								inUseExpiredKeyUsers.push(keyMetadata.UserName);
							} else {
								notInUseExpiredKey = true;
								notInUseExpiredKeyUsers.push(keyMetadata.UserName);
							}
						}
					});
				}
			}
		});
	});
}

function inUse () {
	return {
		getStatus: () => ({
			name: 'AWS keys (in use): active and within the rotation period',
			ok: !inUseExpiredKey,
			businessImpact: 'Can not authenticate with AWS',
			lastUpdated,
			severity: 3,
			technicalSummary: 'AWS keys should be rotated after 90 days',
			checkOutput: !inUseExpiredKey ? '' : `IAM users with expired keys: ${inUseExpiredKeyUsers.join(', ')}`,
			panicGuide: 'Guide about how to rotate AWS keys: https://docs.google.com/document/d/1bILX3O37XmhKOtpWvox9BeZ6RW4-aOn9VzmNqc16BcQ/edit'
		})
	};
}

function notInUse () {
	return {
		getStatus: () => ({
			name: 'AWS keys (not in use): active and within the rotation period',
			ok: !notInUseExpiredKey,
			businessImpact: 'Can not authenticate with AWS',
			lastUpdated,
			severity: 3,
			technicalSummary: 'AWS keys should be rotated after 90 days',
			checkOutput: !notInUseExpiredKey
				? ''
				: `IAM users with expired keys: ${notInUseExpiredKeyUsers.join(', ')}`,
			panicGuide: 'Guide about how to rotate AWS keys: https://docs.google.com/document/d/1bILX3O37XmhKOtpWvox9BeZ6RW4-aOn9VzmNqc16BcQ/edit'
		})
	};
}

function deleted () {
	return {
		getStatus: () => ({
			name: 'All AWS keys are still active',
			ok: deletedKeys.length === 0,
			businessImpact: 'There are keys deleted from AWS',
			lastUpdated,
			severity: 3,
			technicalSummary: 'AWS keys deleted from AWS should be removed from application',
			checkOutput: deletedKeys.length === 0 ? '' : `The following keys were deleted from AWS: ${deletedKeys.join(', ')}`,
			panicGuide: 'Keys should be removed from vault'
		})
	};
}

module.exports = {
	init: function () {
		checkAwsKeys();
		setInterval(checkAwsKeys, INTERVAL);
	},
	checks: [inUse(), notInUse(), deleted()]
};