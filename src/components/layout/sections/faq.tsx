import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "What products do you currently have at xRefracted?",
    answer:
      "Our current product is Mark AI, a platform that automatically grades examinations and provides tailored feedback to students to enhance their learning as well as increase Teachers' productivity.",
    value: "item-1",
  },
  {
    question: "Do you provide APIs for easy integration with Mark?",
    answer:
      "Yes.Just contact us and refer to Mark AI since it's our only publicly available project.",
    value: "item-2",
  },
  {
    question: "How do I join your team?",
    answer:
      "We're a small team based around the world. Fill out our contact form and we promise to respond to you asap.",
    value: "item-3",
  },
  {
    question: "How much time does it take for a teacher to master Mark AI?",
    answer:
      "We have designed Mark to be as intuitive as possible. Marking with Mark is like moderating a colleague; you interact with it just as you would with another teacher. This means there is effectively nothing new to learn. Combined with our continuous efforts to optimise the user interface, Mark is so intuitive that most teachers don't even need a demo to understand how to use it. Nevertheless, we provide constant and immediate support to every school we work with, just in case.",
    value: "item-4",
  },
  {
    question: "What about data privacy and security for Mark AI?",
    answer:
      "We understand the sensitive nature of this information and have implemented robust measures to protect it. Our approach is unique: Mark learns like a teacher, not an AI, which means we never train on your data. Your information remains exclusively yours and stays within your school, allowing you to use Mark just as you would any other assessment submission platform. We also ensure that no unsecured third-party access is allowed. All your uploaded assessments are stored securely on U.S servers, encrypted in transit, and access is audited. For more details, please refer to our Legal pages.",
    value: "item-5",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="mx-auto px-4 py-10 md:py-16 lg:py-20 w-full sm:w-[60%] md:w-[80%] lg:w-[70%] xl:w-[60%]">
      <div className="text-center mb-10">
        <h2 className="text-xl text-primary text-center mb-3 tracking-wider font-semibold">
          FAQS
        </h2>

        <h2 className="text-4xl md:text-5xl text-center font-bold mb-4">
          Common Questions
        </h2>
        <p className="text-base text-muted-foreground">
          Find answers to the most frequently asked questions about our services.
        </p>
      </div>

      <Accordion type="single" collapsible className="AccordionRoot text-base md:text-lg py-2 px-10">
        {FAQList.map(({ question, answer, value }) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left py-4  text-lg font-semibold">
              {question}
            </AccordionTrigger>

            <AccordionContent className="text-base md:text-lg py-2 text-muted-foreground">
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};