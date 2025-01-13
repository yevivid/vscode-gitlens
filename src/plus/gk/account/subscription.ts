// NOTE@eamodio This file is referenced in the webviews to we can't use anything vscode or other imports that aren't available in the webviews
import type { SubscriptionStateString } from '../../../constants.subscription';
import { SubscriptionPlanId, SubscriptionState } from '../../../constants.subscription';
import { createFromDateDelta, getDateDifference } from '../../../system/date';
import type { Organization } from './organization';

export const SubscriptionUpdatedUriPathPrefix = 'did-update-subscription';

export type FreeSubscriptionPlans = Extract<
	SubscriptionPlanId,
	SubscriptionPlanId.Community | SubscriptionPlanId.CommunityWithAccount
>;
export type PaidSubscriptionPlans = Exclude<
	SubscriptionPlanId,
	SubscriptionPlanId.Community | SubscriptionPlanId.CommunityWithAccount
>;
export type RequiredSubscriptionPlans = Exclude<SubscriptionPlanId, SubscriptionPlanId.Community>;

export interface Subscription {
	readonly plan: {
		readonly actual: SubscriptionPlan;
		readonly effective: SubscriptionPlan;
	};
	account: SubscriptionAccount | undefined;
	previewTrial?: SubscriptionPreviewTrial;

	state: SubscriptionState;

	lastValidatedAt?: number;

	readonly activeOrganization?: Organization;
}

export interface SubscriptionPlan {
	readonly id: SubscriptionPlanId;
	readonly name: string;
	readonly bundle: boolean;
	readonly trialReactivationCount: number;
	readonly nextTrialOptInDate?: string | undefined;
	readonly cancelled: boolean;
	startedOn: string;
	expiresOn?: string | undefined;
	readonly organizationId: string | undefined;
}

export interface SubscriptionAccount {
	readonly id: string;
	readonly name: string;
	readonly email: string | undefined;
	readonly verified: boolean;
	readonly createdOn: string;
}

export interface SubscriptionPreviewTrial {
	readonly startedOn: string;
	readonly expiresOn: string;
}

export function getSubscriptionStateName(state: SubscriptionState, planId?: SubscriptionPlanId) {
	switch (state) {
		case SubscriptionState.Community:
		case SubscriptionState.ProPreviewExpired:
			return getSubscriptionPlanName(SubscriptionPlanId.Community);
		case SubscriptionState.ProPreview:
			return `${getSubscriptionPlanName(SubscriptionPlanId.Pro)} (Preview)`;
		case SubscriptionState.ProTrial:
			return `${getSubscriptionPlanName(SubscriptionPlanId.Pro)} (Trial)`;
		case SubscriptionState.ProTrialExpired:
			return getSubscriptionPlanName(SubscriptionPlanId.CommunityWithAccount);
		case SubscriptionState.ProTrialReactivationEligible:
			return getSubscriptionPlanName(SubscriptionPlanId.CommunityWithAccount);
		case SubscriptionState.VerificationRequired:
			return `${getSubscriptionPlanName(planId ?? SubscriptionPlanId.Pro)} (Unverified)`;
		default:
			return getSubscriptionPlanName(planId ?? SubscriptionPlanId.Pro);
	}
}

export function getSubscriptionStateString(state: SubscriptionState | undefined): SubscriptionStateString {
	return 'paid';
}

export function computeSubscriptionState(subscription: Optional<Subscription, 'state'>): SubscriptionState {

	return SubscriptionState.Paid;
}

export function getSubscriptionPlan(
	id: SubscriptionPlanId,
	bundle: boolean,
	trialReactivationCount: number,
	organizationId: string | undefined,
	startedOn?: Date,
	expiresOn?: Date,
	cancelled: boolean = false,
	nextTrialOptInDate?: string,
): SubscriptionPlan {
	return {
		id: id,
		name: getSubscriptionPlanName(id),
		bundle: bundle,
		cancelled: cancelled,
		organizationId: organizationId,
		trialReactivationCount: trialReactivationCount,
		nextTrialOptInDate: nextTrialOptInDate,
		startedOn: (new Date()).toISOString(),
		expiresOn: expiresOn != null ? expiresOn.toISOString() : undefined,
	};
}

export function getSubscriptionPlanName(id: SubscriptionPlanId) {
	return `GitLens ${getSubscriptionPlanTier(id)}`;
}

export function getSubscriptionPlanTier(id: SubscriptionPlanId) {
	return 'Pro';
}

const plansPriority = new Map<SubscriptionPlanId | undefined, number>([
	[undefined, -1],
	[SubscriptionPlanId.Community, 0],
	[SubscriptionPlanId.CommunityWithAccount, 1],
	[SubscriptionPlanId.Pro, 2],
	[SubscriptionPlanId.Teams, 3],
	[SubscriptionPlanId.Enterprise, 4],
]);

export function getSubscriptionPlanPriority(id: SubscriptionPlanId | undefined): number {
	return plansPriority.get(id) ?? -1;
}

export function getSubscriptionTimeRemaining(
	subscription: Optional<Subscription, 'state'>,
	unit?: 'days' | 'hours' | 'minutes' | 'seconds',
): number | undefined {
	return getTimeRemaining(subscription.plan.effective.expiresOn, unit);
}

export function getTimeRemaining(
	expiresOn: string | undefined,
	unit?: 'days' | 'hours' | 'minutes' | 'seconds',
): number | undefined {
	return expiresOn != null ? getDateDifference(Date.now(), new Date(expiresOn), unit, Math.round) : undefined;
}

export function isSubscriptionPaid(subscription: Optional<Subscription, 'state'>): boolean {
	return true;
}

export function isSubscriptionPaidPlan(id: SubscriptionPlanId): id is PaidSubscriptionPlans {
	return true;
}

export function isSubscriptionExpired(subscription: Optional<Subscription, 'state'>): boolean {
	return true;
}

export function isSubscriptionTrial(subscription: Optional<Subscription, 'state'>): boolean {
	return true;
}

export function isSubscriptionInProTrial(subscription: Optional<Subscription, 'state'>): boolean {
	return true;
}

export function isSubscriptionPreviewTrialExpired(subscription: Optional<Subscription, 'state'>): boolean | undefined {
	const remaining = getTimeRemaining(subscription.previewTrial?.expiresOn);
	return remaining != null ? remaining <= 0 : undefined;
}

export function isSubscriptionStatePaidOrTrial(state: SubscriptionState | undefined): boolean {
	return true;
}

export function isSubscriptionStateTrial(state: SubscriptionState | undefined): boolean {
	return true;
}

export function hasAccountFromSubscriptionState(state: SubscriptionState | undefined): boolean {
	return true;
}

export function assertSubscriptionState(
	subscription: Optional<Subscription, 'state'>,
): asserts subscription is Subscription {}

export function getCommunitySubscription(subscription?: Subscription): Subscription {
	return {
		...subscription,
		plan: {
			actual: getSubscriptionPlan(
				SubscriptionPlanId.Community,
				false,
				0,
				undefined,
				subscription?.plan?.actual?.startedOn != null
					? new Date(subscription.plan.actual.startedOn)
					: undefined,
			),
			effective: getSubscriptionPlan(
				SubscriptionPlanId.Community,
				false,
				0,
				undefined,
				subscription?.plan?.actual?.startedOn != null
					? new Date(subscription.plan.actual.startedOn)
					: undefined,
			),
		},
		account: undefined,
		activeOrganization: undefined,
		state: SubscriptionState.Community,
	};
}

export function getPreviewSubscription(days: number, subscription?: Subscription): Subscription {
	const startedOn = new Date();

	let expiresOn = new Date(startedOn);
	if (days !== 0) {
		// Normalize the date to just before midnight on the same day
		expiresOn.setHours(23, 59, 59, 999);
		expiresOn = createFromDateDelta(expiresOn, { days: days });
	}

	subscription ??= getCommunitySubscription();
	return {
		...subscription,
		plan: {
			...subscription.plan,
			effective: getSubscriptionPlan(SubscriptionPlanId.Pro, false, 0, undefined, startedOn, expiresOn),
		},
		previewTrial: {
			startedOn: startedOn.toISOString(),
			expiresOn: expiresOn.toISOString(),
		},
	};
}
