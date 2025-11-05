// src/app/(dashboard)/dashboard/profile/cognitive-profile/learning-compass-assessment.tsx
'use client'

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // FIX: Import useRouter for navigation
import { toast } from 'sonner'; // FIX: Import sonner for consistent toasts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Brain, Target, Users, BookOpen } from 'lucide-react';
import {
  saveCognitiveAssessment,
  CognitiveAssessmentPayload,
  CognitiveAssessmentStructure,
  CognitiveProfile,
  LearningTool,
} from '@/lib/actions/cognitive';
import { generateCognitiveReport } from '@/lib/actions/reports';

type Profile = CognitiveProfile & { icon: React.ReactNode; tools: LearningTool[] };

interface LearningCompassProps {
  studentId: string;
  studentName: string;
  assessmentData: CognitiveAssessmentStructure;
  className: string;
  classId: string; // FIX: Add classId to props
}

export default function LearningCompassAssessment({
  studentId,
  studentName: initialStudentName,
  assessmentData,
  className,
  classId, // FIX: Receive classId
}: LearningCompassProps) {
  const router = useRouter(); // FIX: Initialize the router
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd'>>({});
  const [studentName, setStudentName] = useState(initialStudentName);
  const [scores, setScores] = useState({ mentalEnergy: 0, learningStrategy: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const { assessment, profiles: dbProfiles, tools: dbTools, profileToolLinks } = assessmentData;
  
  const sections = useMemo(() => assessment.sections, [assessment.sections]);
  const allQuestions = useMemo(() => sections.flatMap(s => s.questions), [sections]);

  const profiles = useMemo(() => Object.fromEntries(
    dbProfiles.map(p => {
      let icon = <Brain className="w-6 h-6" />;
      if (p.profile_name === 'The Careful Builder') icon = <BookOpen className="w-6 h-6" />;
      if (p.profile_name === 'The Energetic Explorer') icon = <Target className="w-6 h-6" />;
      if (p.profile_name === 'The Confident Navigator') icon = <Users className="w-6 h-6" />;
      
      const toolIds = profileToolLinks.filter(link => link.profile_id === p.profile_id).map(link => link.tool_id);
      const tools = dbTools.filter(tool => toolIds.includes(tool.id));

      return [p.profile_name, { ...p, icon, tools }];
    })
  ), [dbProfiles, dbTools, profileToolLinks]);

  const steps = useMemo(() => ['Introduction', ...sections.map(s => s.title), 'Results & Profile', 'Your Toolkit', 'Action Plan'], [sections]);

  const calculateScores = useCallback(() => {
    let mentalEnergyScore = 0, learningStrategyScore = 0;
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));

    for (const [questionId, answer] of Object.entries(answers)) {
      const question = questionMap.get(questionId);
      if (question) {
        const sectionOrder = sections.find(s => s.id === question.section_id)?.order || 0;
        if (sectionOrder <= 2) {
          mentalEnergyScore += question.points[answer];
        } else {
          learningStrategyScore += question.points[answer];
        }
      }
    }
    
    setScores({ mentalEnergy: mentalEnergyScore, learningStrategy: learningStrategyScore });

    let profileName = '';
    if (mentalEnergyScore >= 15 && learningStrategyScore >= 15) profileName = 'The Confident Navigator';
    else if (mentalEnergyScore >= 15 && learningStrategyScore < 15) profileName = 'The Energetic Explorer';
    else if (mentalEnergyScore < 15 && learningStrategyScore >= 15) profileName = 'The Thoughtful Planner';
    else profileName = 'The Careful Builder';
    
    setProfile(profiles[profileName] || null);
  }, [answers, allQuestions, sections, profiles]);

  useEffect(() => {
    if (allQuestions.length > 0 && Object.keys(answers).length === allQuestions.length) {
      calculateScores();
    }
  }, [answers, allQuestions.length, calculateScores]);

  const handleAnswerChange = (questionId: string, value: 'a' | 'b' | 'c' | 'd') => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleSaveAndGenerateReport = () => {
    if (!profile) return;
    startTransition(async () => {
      try {
        const questionIdToNumberMap = new Map(allQuestions.map(q => {
          const sectionOrder = sections.find(s => s.id === q.section_id)?.order || 1;
          return [q.id, q.order + (sectionOrder - 1) * 3];
        }));
        const profileScoresForDb = Object.fromEntries(
          Object.entries(answers).map(([questionId, answer]) => [questionIdToNumberMap.get(questionId), answer])
        );

        const assessmentPayload: CognitiveAssessmentPayload = {
          student_id: studentId,
          assessment_id: assessment.id,
          profile_scores: profileScoresForDb,
          mental_energy_score: scores.mentalEnergy,
          learning_strategy_score: scores.learningStrategy,
        };
        
        // FIX: Pass the classId to the server action for correct revalidation
        await saveCognitiveAssessment(assessmentPayload, classId);
        toast.success('Assessment results have been saved.');

        const reportPayload = { studentName, className, scores, profile: { name: profile.profile_name, description: profile.description || '' }, selectedTools };
        const { data: pdfBlob, error } = await generateCognitiveReport(reportPayload);
        if (error) throw new Error(error.message);
        if (pdfBlob) {
          const url = window.URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Learning_Compass_Report_${studentName.replace(' ', '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          toast.success('Your PDF report is downloading.');
        }

        // FIX: Redirect the user back to the student profile page to see the updated history
        toast.info('Redirecting back to student profile...');
        router.push(`/dashboard/classes/${classId}/${studentId}`);

      } catch (err) {
        // FIX: Use sonner toast for error messages
        toast.error('An Error Occurred', { description: err instanceof Error ? err.message : 'Could not save or generate report.' });
      }
    });
  };

  const renderIntroduction = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-blue-600">{assessment.title}</CardTitle>
        <CardDescription className="text-lg">A Diagnostic Tool for Unlocking Student Potential</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Hello, Future Scientist of Your Own Mind!</h3>
          <p className="text-gray-700 mb-4">This is not a test. There are no right or wrong answers. This is your personal compass to help you become a &quot;Learning Scientist.&quot; A Learning Scientist is someone who observes how their own mind works, understands its strengths, and experiments with new ways to become a better, stronger learner.</p>
          <p className="text-gray-700">Your honest answers will give you a map to understand yourself. Let&apos;s begin our investigation!</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Assessment Overview</h3>
          <p className="text-gray-600 text-center">Part 1: The Observation - Understanding Your Learning Habits</p>
          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="text-lg px-3 py-1">{section.order}</Badge>
                    <CardTitle className="text-lg">{section.title.replace(/Section [A-D]: /g, '')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                  <div className="text-xs text-gray-500">{section.questions.length} questions</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg"><h4 className="font-semibold text-green-800 mb-2">For Teachers:</h4><p className="text-sm text-green-700">This assessment takes 15-20 minutes per student. Encourage honest responses and emphasize that this is for self-discovery, not evaluation.</p></div>
          <div className="bg-yellow-50 p-4 rounded-lg"><h4 className="font-semibold text-yellow-800 mb-2">Remember:</h4><p className="text-sm text-yellow-700">Read each question carefully and choose the answer that sounds most like you. Be honest - this helps you get the most useful results!</p></div>
        </div>
        <div className="space-y-4">
          <Label htmlFor="student-name">Student Name:</Label>
          <input id="student-name" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Enter student's name here..." />
        </div>
        <Button onClick={() => setCurrentStep(1)} className="w-full" size="lg">Begin Assessment</Button>
      </CardContent>
    </Card>
  );

  const renderSection = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return null;
    const sectionProgress = ((currentStep - 1) / sections.length) * 100;
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4"><Badge variant="outline">Part 1: The Observation</Badge><span className="text-sm text-gray-500">Section {sectionIndex + 1} of {sections.length}</span></div>
          <Progress value={sectionProgress} className="mb-4" />
          <CardTitle className="text-xl">{section.title}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {section.questions.map((question, qIndex) => (
            <div key={question.id} className="space-y-4">
              <div className="flex items-start space-x-3"><Badge variant="secondary" className="mt-1">{question.order + (section.order - 1) * 3}</Badge><p className="text-gray-800 font-medium">{question.text}</p></div>
              <RadioGroup value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value as 'a' | 'b' | 'c' | 'd')} className="ml-8">
                {Object.entries(question.options).map(([key, text]) => (
                  <div key={key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={key} id={`q${question.id}-${key}`} className="mt-1" />
                    <Label htmlFor={`q${question.id}-${key}`} className="flex-1 cursor-pointer text-gray-700 leading-relaxed"><span className="font-medium text-blue-600 mr-2">{key.toUpperCase()})</span>{text}</Label>
                  </div>
                ))}
              </RadioGroup>
              {qIndex < section.questions.length - 1 && <Separator />}
            </div>
          ))}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1}>Previous</Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!section.questions.every(q => answers[q.id])}>{currentStep === sections.length ? 'View Results' : 'Next Section'}</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center"><CardTitle className="text-2xl">Part 2: The Hypothesis</CardTitle><CardDescription>Discovering Your Learning Profile</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6"><div className="bg-blue-50 p-6 rounded-lg"><h3 className="text-lg font-semibold text-blue-800 mb-2">Mental Energy Score</h3><p className="text-sm text-blue-600 mb-2">How you process information (Sections A + B)</p><div className="text-3xl font-bold text-blue-600">{scores.mentalEnergy}</div><div className="text-sm text-gray-600 mt-2">Range: 6-24 points</div></div><div className="bg-green-50 p-6 rounded-lg"><h3 className="text-lg font-semibold text-green-800 mb-2">Learning Strategy Score</h3><p className="text-sm text-green-600 mb-2">How you use information (Sections C + D)</p><div className="text-3xl font-bold text-green-600">{scores.learningStrategy}</div><div className="text-sm text-gray-600 mt-2">Range: 6-24 points</div></div></div>
        {profile && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
            <div className="flex items-center space-x-3 mb-4">{profile.icon}<h2 className="text-2xl font-bold text-purple-800">{profile.profile_name}</h2></div>
            <p className="text-gray-700 mb-3">{profile.description}</p>
            <p className="text-gray-600 text-sm italic">Remember: This profile is not a label. It is simply a starting point for your scientific journey.</p>
          </div>
        )}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
          <Button onClick={() => setCurrentStep(currentStep + 1)}>Explore Your Toolkit</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderToolkit = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center"><CardTitle className="text-2xl">Part 3: The Experiment</CardTitle><CardDescription>Your Upgraded Personalised Toolkit</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        {profile && (
          <>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">{profile.icon}<h2 className="text-xl font-bold text-purple-800">{profile.profile_name}</h2></div>
              <div className="space-y-3"><div><h3 className="font-semibold text-gray-800">Your Focus:</h3><p className="text-gray-700">{profile.focus}</p></div></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Upgraded Tools:</h3>
              <p className="text-gray-600 mb-4">Read about these tools, then choose one or two to experiment with. The goal is to find what works for you.</p>
              {profile.tools.map((tool) => (
                <div key={tool.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-blue-700">{tool.name}</h4>
                    <input type="checkbox" checked={selectedTools.includes(tool.name)} onChange={(e) => { if (e.target.checked) { setSelectedTools([...selectedTools, tool.name]); } else { setSelectedTools(selectedTools.filter(t => t !== tool.name)); } }} className="w-5 h-5" />
                  </div>
                  <p className="text-gray-700 mb-3">{tool.description}</p>
                  {tool.how_to && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">How to use it:</h5>
                      <p className="text-sm text-gray-700">{tool.how_to}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedTools.length > 0 && (<div className="bg-green-50 p-4 rounded-lg"><h4 className="font-semibold text-green-800 mb-2">Selected Tools for Experimentation:</h4><ul className="list-disc list-inside text-green-700">{selectedTools.map((tool, index) => (<li key={index}>{tool}</li>))}</ul></div>)}
          </>
        )}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
          <Button onClick={() => setCurrentStep(currentStep + 1)}>Create Action Plan</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderActionPlan = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center"><CardTitle className="text-2xl">Part 4: My Learning Action Plan</CardTitle><CardDescription>Your commitment to growth and experimentation</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg"><p className="text-blue-800 font-medium mb-2">This plan is a commitment between the student, teacher, and parent to work together. It is a living document to guide the student&apos;s growth.</p></div>
        <div className="space-y-6">
          <div><Label className="text-lg font-semibold">Scientist&apos;s Name:</Label><div className="mt-2 p-3 border rounded-lg bg-gray-50">{studentName || 'Student Name'}</div></div>
          <div><Label className="text-lg font-semibold">Date:</Label><div className="mt-2 p-3 border rounded-lg bg-gray-50">{new Date().toLocaleDateString()}</div></div>
          <Separator />
          <div><h3 className="text-lg font-semibold mb-3">1. My Learning Profile & Strengths</h3>{profile && (<div className="space-y-4"><div><Label>My Compass profile is:</Label><div className="mt-2 p-3 border rounded-lg bg-gray-50 flex items-center space-x-3">{profile.icon}<span className="font-semibold">{profile.profile_name}</span></div></div><div><Label>Based on my results, some of my current learning strengths are:</Label><textarea className="mt-2 w-full p-3 border rounded-lg min-h-[100px]" placeholder="Reflect on what you learned about yourself from this assessment..." /></div></div>)}</div>
          <Separator />
          <div><h3 className="text-lg font-semibold mb-3">2. My Focus for Growth & My Experimental Toolkit</h3><div className="space-y-4"><div><Label>The main area I want to improve is:</Label><textarea className="mt-2 w-full p-3 border rounded-lg min-h-[100px]" placeholder="What specific aspect of your learning would you like to strengthen?" /></div><div><Label>To help me grow, I will experiment with these strategies from my toolkit:</Label><div className="mt-2 p-4 border rounded-lg bg-gray-50">{selectedTools.length > 0 ? (<ul className="space-y-2">{selectedTools.map((tool, index) => (<li key={index} className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>{tool}</span></li>))}</ul>) : (<p className="text-gray-500 italic">No tools selected yet. Go back to choose your experimental toolkit!</p>)}</div></div></div></div>
          <Separator />
          <div><h3 className="text-lg font-semibold mb-3">3. Our Commitments</h3><div className="space-y-4"><div className="bg-blue-50 p-4 rounded-lg"><h4 className="font-semibold text-blue-800 mb-2">My Commitment as the Learning Scientist:</h4><p className="text-blue-700 text-sm">I will honestly try to use the new strategies I have selected to improve my learning. I will be patient with myself and remember that learning is a journey.</p><div className="mt-3"><Label>Student&apos;s Signature:</Label><div className="mt-2 p-3 border-2 border-dashed border-blue-300 rounded-lg min-h-[60px] bg-white"><span className="text-gray-400 text-sm italic">Digital signature area</span></div></div></div><div className="bg-green-50 p-4 rounded-lg"><h4 className="font-semibold text-green-800 mb-2">Teacher&apos;s Support Pledge:</h4><p className="text-green-700 text-sm">I have reviewed this plan with the student. I will support their growth by providing encouragement, checking in on their progress, and using classroom strategies that help all learners.</p><div className="mt-3"><Label>Teacher&apos;s Comments/Signature:</Label><textarea className="mt-2 w-full p-3 border rounded-lg min-h-[80px]" placeholder="Teacher's comments and digital signature..." /></div></div><div className="bg-yellow-50 p-4 rounded-lg"><h4 className="font-semibold text-yellow-800 mb-2">Parent/Guardian Acknowledgement:</h4><p className="text-yellow-700 text-sm">I have seen this plan and will encourage my child&apos;s efforts at home.</p><div className="mt-3"><Label>Parent/Guardian Signature:</Label><div className="mt-2 p-3 border-2 border-dashed border-yellow-300 rounded-lg min-h-[60px] bg-white"><span className="text-gray-400 text-sm italic">To be signed at home</span></div></div></div></div></div>
        </div>
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={isPending}>Previous</Button>
          <Button onClick={handleSaveAndGenerateReport} disabled={isPending}>
            {isPending ? 'Saving & Generating...' : 'Save & Download PDF Report'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {assessment.title}
                </h1>
                <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/80">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <div className="space-y-4">
                <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-3 bg-blue-100" />
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                  {steps.map((step, index) => (
                    <div key={index} className={`text-center p-3 rounded-lg transition-all duration-200 ${ index <= currentStep ? 'bg-blue-600 text-white shadow-md transform scale-105' : index === currentStep + 1 ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-500' }`}>
                      <div className={`text-lg font-bold mb-1 ${ index <= currentStep ? 'text-white' : 'text-gray-600' }`}>{index + 1}</div>
                      <div className={`text-xs leading-tight ${ index <= currentStep ? 'text-blue-100' : 'text-gray-500' }`}>{step.length > 20 ? step.substring(0, 20) + '...' : step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {currentStep === 0 && renderIntroduction()}
        {currentStep > 0 && currentStep <= sections.length && renderSection(currentStep - 1)}
        {currentStep === sections.length + 1 && renderResults()}
        {currentStep === sections.length + 2 && renderToolkit()}
        {currentStep === sections.length + 3 && renderActionPlan()}
      </div>
    </div>
  );
}
