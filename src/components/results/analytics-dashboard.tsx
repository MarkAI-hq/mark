'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { prepareAnalyticsData } from "@/lib/utils/analytics-mapping"
import { SubmissionResult } from '@/lib/actions/results'
import { BloomLevel, ErrorType } from '@/lib/types'

interface AnalyticsDashboardProps {
  submissionResults: SubmissionResult
  bloomsTaxonomy: BloomLevel[]
  errorTaxonomy: ErrorType[]
}

export function AnalyticsDashboard({ 
  submissionResults, 
  bloomsTaxonomy, 
  errorTaxonomy 
}: AnalyticsDashboardProps) {
  
  const { bloomChartData, errorChartData } = prepareAnalyticsData(
    submissionResults,
    bloomsTaxonomy,
    errorTaxonomy
  );

  const bloomConfig = {
    achievement: { label: "Mastery %", color: "#926C15" },
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:grid-cols-2">
        {/* Radar Card */}
        <Card className="border shadow-sm bg-card/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Cognitive Achievement
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent className="max-w-[250px] text-[10px]">
                  Visualizes mastery levels based on Bloom&apos;s Taxonomy.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bloomConfig} className="mx-auto aspect-square max-h-[250px]">
              <RadarChart data={bloomChartData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="level" tick={{ fontSize: 10 }} />
                <Radar dataKey="achievement" fill="#926C15" fillOpacity={0.4} stroke="#926C15" strokeWidth={2} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Card */}
        <Card className="border shadow-sm bg-card/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Error Taxonomy
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent className="max-w-[250px] text-[10px]">
                  Breakdown of identified error types in this submission.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[250px]">
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[180px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={errorChartData} dataKey="count" nameKey="name" innerRadius={55} strokeWidth={2}>
                  {errorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 w-full">
              {errorChartData.map((err) => (
                <Tooltip key={err.name}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-[10px] cursor-help group">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: err.fill }} />
                      <span className="font-medium truncate text-muted-foreground group-hover:text-foreground">{err.name}</span>
                      <span className="ml-auto font-bold">{err.count}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-[10px]">
                    <p className="font-bold">{err.name} ({err.domain})</p>
                    <p className="mt-1">{err.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
