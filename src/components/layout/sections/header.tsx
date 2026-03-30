import Image from "next/image";

export default function Header() {
  return (
    <>
      <section className="overflow-hidden m-4 min-w-10 dark:min-w-14 dark:m-4 lg:pt-[16px] dark:lg:pt-[16px] lg:pb-[0px]">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between -mx-4">
            <div className="w-full px-4 lg:w-7/12">
              <div className="flex items-center -mx-3 sm:-mx-4 dark:sm:-mx-4 dark:-mx-3">
                <div className="w-full px-3 sm:px-4 xl:w-1/2">
                  <div className="py-3 sm:py-4">
                    <Image
                      src="/assets/images/school.jpg"
                      alt="African kids studying under a tree while seated on ground"
                      className="w-full rounded-2xl shadow-xl"
                      width={1200}
                      height={500}  
                    />
                  </div>
                  <div className="py-3 sm:py-4">
                    <Image
                      src="/assets/images/graduand.jpg"
                      alt="A young lady in a gown graduating"
                      className="w-full rounded-2xl shadow-md dark:shadow-xl"
                      width={1200}
                      height={500}
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:px-4 xl:w-1/2">
                  <div className="relative z-9 my-4">
                    <Image
                      src="/assets/images/enstein.jpg"
                      alt="Albert Enstein"
                      className="w-full rounded-2xl shadow-xl"
                      width={1200}
                      height={500}
                    />
                    <span className="absolute -right-7 -bottom-7 z-[-1]">
                      <svg
                        width={134}
                        height={106}
                        viewBox="0 0 134 106"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full px-4 lg:w-1/2 xl:w-5/12 pb-3 " >
              <div className="mt-10 lg:mt-0">
                <span className="block mb-4 text-lg font-semibold text-primary dark:text-gray-300">
                  Tomorrow&apos;s Education is Personalized!
                </span>
                <h2 className="mb-5 text-3xl font-bold sm:text-[40px]/[48px] text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text">
                  Will you join us in shaping the future of education?
                </h2>
                <p className="mb-5 text-base text-body-color dark:text-gray-500">
                  Are you an expert STEM educator, curriculum designer, or learning scientist 
                  with a unique approach to teaching? Mark AI invites you to share your wisdom and be an architect of tomorrow&apos;s education.
                </p>
                <p className="mb-8 text-base text-body-color dark:text-gray-500">
                   We&#39;re working towards a shared vision of putting an intelligent personalized
                   teacher in every learner&#39;s pocket beginning with STEM subjects. 
                   This will bridge the teacher:student gap, address poor performances, and the misalignments between industry requirements
                   and curricula creating a new generation of people ready to transform the world.
                </p>
                <a
                  href="mailto:founding@mirror.education ?subject=How%20Can%20We%20Collaborate?"
                  target="_blank"
                  rel="noopener"
                  className="px-6 py-3 text-lg font-medium text-center text-white bg-black dark:bg-white dark:hover:bg-[#926C15] dark:text-black dark:hover:text-white hover:bg-[#926C15] rounded-md ">
                  Join Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};