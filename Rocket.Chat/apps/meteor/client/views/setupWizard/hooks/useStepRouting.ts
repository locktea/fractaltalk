import { useRouteParameter, useRouter, useRole, useSetting } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';

export const useStepRouting = (skipCloudRegistration: boolean = false): [number, Dispatch<SetStateAction<number>>] => {
	const param = useRouteParameter('step');
	const router = useRouter();
	const hasAdminRole = useRole('admin');
	const hasOrganizationData = !!useSetting('Organization_Name');

	const [currentStep, setCurrentStep] = useState<number>(() => {
		const initialStep = (() => {
			// If organization data exists but registration is skipped, don't go to step 3
			if (hasOrganizationData && skipCloudRegistration) {
				// Wizard should complete, but if we're here, go to step 2
				return 2;
			}
			if (hasOrganizationData) {
				return 3;
			}
			if (hasAdminRole) {
				return 2;
			}
			return 1;
		})();

		if (!param) {
			return initialStep;
		}

		const step = parseInt(param, 10);
		if (step && Number.isFinite(step) && step >= 1) {
			return step;
		}

		return initialStep;
	});

	useEffect(() => {
		// Skip step 3 if registration is disabled - redirect to step 2 instead
		if (currentStep === 3 && skipCloudRegistration) {
			setCurrentStep(2);
			router.navigate(`/setup-wizard/2`);
			return;
		}

		switch (true) {
			case (currentStep === 1 || currentStep === 2) && hasOrganizationData && !skipCloudRegistration: {
				setCurrentStep(3);
				router.navigate(`/setup-wizard/3`);
				break;
			}

			case currentStep === 1 && hasAdminRole: {
				setCurrentStep(2);
				router.navigate(`/setup-wizard/2`);
				break;
			}

			default: {
				router.navigate(`/setup-wizard/${currentStep}`);
			}
		}
	}, [router, currentStep, hasAdminRole, hasOrganizationData, skipCloudRegistration]);

	return [currentStep, setCurrentStep];
};
