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
    question: "How different is Mark AI from an LLM wrapper?",
    answer:
      "Our vision for personalized learning is powered by Mark IPOS; our Proprietary Pedagogical Knowledge Graph, Mark LLM Ochestrator, and human-centric AI shaped by our Expert Curators.",
    value: "item-1",
  },
  {
    question: "Do you provide APIs for easy integration with Mark IPOS?",
    answer:
      "Send us a message explaining how you'd wish to integrate Mark AI into your own system and we will get back to you with 3 working days.",
    value: "item-2",
  },
  {
    question: "How do I join your team?",
    answer:
      "We're always looking for visionaries who want to build the future and those who see things differently. If this is you, shoot us an email at info@xrefracted.com. We promise to respond to you as soon as possible.",
    value: "item-3",
  },
  {
    question: "How long will it take for my institution to see the benefits of Mark AI?",
    answer:
      "Mark AI provides benefits as soon as you begin using it to either create and grade exams, provide personalized feedback or generate personalized learning pathways for learners. Schedule a demo today to transform your classroom",
    value: "item-4",
  },
  {
    question: "What about data privacy and security for Mark AI?",
    answer:
      "We understand the sensitive nature of this information and have implemented robust measures to protect it. Our approach is unique: Mark learns like a teacher, not an AI, which means we never train on your data. Your information remains exclusively yours and stays within your school, allowing you to use Mark safely. We also ensure that no unsecured third-party access is allowed. All your uploaded work is stored securely on U.S servers, encrypted in transit, and access is audited. For more details, please refer to our Legal pages.",
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

        <h2 className="text-4xl md:text-5xl text-center font-bold mb-4 text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text">
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