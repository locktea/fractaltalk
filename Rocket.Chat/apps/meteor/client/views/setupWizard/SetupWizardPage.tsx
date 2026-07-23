import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { useSetupWizardContext } from './contexts/SetupWizardContext';
import AdminInfoStep from './steps/AdminInfoStep';
import CloudAccountConfirmation from './steps/CloudAccountConfirmation';
import OrganizationInfoStep from './steps/OrganizationInfoStep';
import RegisterServerStep from './steps/RegisterServerStep';

const SetupWizardPage = (): ReactElement => {
	const { currentStep, skipCloudRegistration, completeSetupWizard, loaded } = useSetupWizardContext();

	// If on registration step but registration is skipped, complete the wizard
	useEffect(() => {
		if (loaded && currentStep === 3 && skipCloudRegistration) {
			completeSetupWizard();
		}
	}, [currentStep, skipCloudRegistration, completeSetupWizard, loaded]);

	// Don't render step 3 if registration is skipped
	if (currentStep === 3 && skipCloudRegistration) {
		return <></>;
	}

	switch (currentStep) {
		case 1:
			return <AdminInfoStep />;
		case 2:
			return <OrganizationInfoStep />;
		case 3:
			return <RegisterServerStep />;
		case 4:
			return <CloudAccountConfirmation />;

		default:
			throw new Error('Wrong wizard step');
	}
};

export default SetupWizardPage;
