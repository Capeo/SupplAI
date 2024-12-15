export async function checkCompanyStatus(companyName: string): Promise<boolean> {
  try {
    // TODO: Run check against https://www.arbeidstilsynet.no/godkjenninger/godkjente-bemanningsforetak/
    if (companyName == "Qwert AS") {
        return true;
    }
    else {
        return false;
    }
  } catch (error) {
    console.error('Company Check Error:', error);
    throw new Error('Failed to verify company status');
  }
} 