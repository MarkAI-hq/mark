import React from "react";

const Header = () => {

  return (
    <>
      <section className="overflow-hidden m-4 min-w-10 dark:min-w-14 dark:m-4 lg:pt-[16px] dark:lg:pt-[16px] lg:pb-[0px]">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between -mx-4">
            <div className="w-full px-4 lg:w-6/12">
              <div className="flex items-center -mx-3 sm:-mx-4 dark:sm:-mx-4 dark:-mx-3">
                <div className="w-full px-3 sm:px-4 xl:w-1/2">
                  <div className="py-3 sm:py-4">
                    <img
                      src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.rippleafrica.org%2Fwp-content%2Fuploads%2F2017%2F02%2FEducation-Malawi-Africa-7-charity.jpg&f=1&nofb=1&ipt=26a6423e39e8fa61b7ea41daabdb9ae53e6d3065bb09e579d40b1506e099f82a"
                      alt="African kids studying under a tree while seated on ground"
                      className="w-full rounded-2xl shadow-xl"
                    />
                  </div>
                  <div className="py-3 sm:py-4">
                    <img
                      src="https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fsophie-sticatedmom.com%2Fwp-content%2Fuploads%2F2018%2F04%2F26458463_l.jpg&f=1&nofb=1&ipt=d5941655fb86405dadd58be14146cb963480ede6529e588fea7ffa37e547e94c"
                      alt="A young lady in a gown graduating"
                      className="w-full rounded-2xl shadow-md dark:shadow-xl"
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:px-4 xl:w-1/2">
                  <div className="relative z-9 my-4">
                    <img
                      src="https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fcdn.history.com%2Fsites%2F2%2F2015%2F10%2FGettyImages-2669928.jpg&f=1&nofb=1&ipt=bc4c6c7ab5af8e3ff3f0b1f1a2720bb776895f17c7c6db220d9e264bdbd1cba6"
                      alt="Albert Enstein"
                      className="w-full rounded-2xl shadow-xl"
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
                  The future of education is personalized.
                </span>
                <h2 className="mb-5 text-3xl font-bold dark:text-gray-400 sm:text-[40px]/[48px]">
                  What if every student could become?
                </h2>
                <p className="mb-5 text-base text-body-color dark:text-gray-500">
                Learners loose their dreams because of a one-for-all instruction model.
                </p>
                <p className="mb-8 text-base text-body-color dark:text-gray-500">
                Using AI, we help teachers understand each learner and tailor support to them. 
                We're building a new way of instruction and learning backed by the decades of  
                research in the science of learning creating unique experiences for both the  
                the teachers and students. We're looking for principals or headteachers, students 
                and parents who want to build this new future of education, will you answer?
                </p>
                <a
                href="mailto:info@xrefracted.com ?subject=How%20Can%20We%20Collaborate?"
                target="_blank"
                rel="noopener"
                className="px-8 py-4 text-lg font-medium text-center text-white bg-purple-600 rounded-md ">
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

export default Header;