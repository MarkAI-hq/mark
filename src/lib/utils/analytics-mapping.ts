import { SubmissionResult } from '@/lib/actions/results';
import { BloomLevel, ErrorType } from '@/lib/types';

export const prepareAnalyticsData = (
  submissionResults: SubmissionResult,
  bloomsTaxonomy: BloomLevel[],
  errorTaxonomy: ErrorType[]
) => {
  // Use the responses array from the result object
  const responses = submissionResults.responses || []; 

  const bloomChartData = bloomsTaxonomy.map((level) => {
    const relevantResponses = responses.filter(
      (r) => r.blooms_level_achieved === level.level_id
    );
    const score = relevantResponses.reduce((acc, curr) => acc + (curr.points_earned || 0), 0);
    
    return {
      level: level.level_name,
      achievement: relevantResponses.length > 0 ? (score / relevantResponses.length) * 100 : 0,
      description: level.description, // Ensure this is passed
    };
  });

  const allIdentifiedErrorIds = responses.flatMap((r) => r.identified_errors || []);
  const errorChartData = errorTaxonomy
    .map((err) => ({
      name: err.error_name,
      count: allIdentifiedErrorIds.filter((id) => id === err.error_id).length,
      fill: `var(--color-${err.error_code.toLowerCase()})`,
      domain: err.domain, // FIX: Added property
      description: err.description, // FIX: Added property
    }))
    .filter((d) => d.count > 0);

  return { bloomChartData, errorChartData };
};
