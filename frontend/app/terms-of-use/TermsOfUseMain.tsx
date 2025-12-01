"use client"

import Heading from "./heading";
import { TableOfContents } from "./TableOfContents";

export default function TermsOfUseMain(){
    return(
        <div className="max-w-4xl mx-auto px-1 md:px-6 py-3 md:py-6 md:text-[1rem] text-[0.9rem]">

        {/* CARD */}
        <div className="
          bg-white 
          shadow-md 
          rounded-2xl 
          p-5 
          sm:p-8 
          md:p-12 
          border border-gray-100
        ">

          {/* TOC */}
          <div className="mb-10 sm:mb-12 ">
            <h2 className="text-md md:text-xl font-semibold mb-4 text-[#008753]">
              Table of Contents
            </h2>

            <ol className="space-y-3 text-gray-700 pl-5">
              {TableOfContents.map((item, index) => (
                <li key={item.id} className="relative pl-6">
                  <span className="absolute left-0 top-0 text-gray-600">
                    {index + 1}.
                  </span>

                  <button
                    onClick={() => {
                      const section = document.getElementById(item.id);
                      section?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="
                      hover:text-[#008753] 
                      group-hover:translate-x-1 
                      transition-all 
                      duration-200
                      text-left
                    "
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ol>



          </div>

          <div className="border-b border-gray-200 mb-10"></div>


            
          <section className="">
            {/* ACCEPTANCE OF TERMS */}
            <article id="acceptance">
              <Heading text={"1. ACCEPTANCE OF TERMS"}/>
              <p>
                Welcome to SabiWay! These Terms of Use (the "Terms," "Agreement," or
                "Terms of Use") constitute a legally binding agreement between you and
                SabiWay LTD ("SabiWay," "we," "us," or "our") governing your access to and
                use of the SabiWay website located at [www.sabiway.com], our mobile
                applications available on iOS and Android platforms, and all associated
                services (collectively, the "Platform" or "Services").
              </p>
              <p>
                By accessing, browsing, or using the Platform in any way, including but
                not limited to registering for an account, posting content, or engaging
                with Service Professionals or Customers, you acknowledge that you have
                read, understood, and agree to be bound by these Terms and our Privacy
                Policy, which is incorporated herein by reference.
              </p>
              <p>
                <strong
                  >IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE
                  PLATFORM.</strong
                >
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            

            {/* DEFINITIONS */}
            <article id="definitions">
              <Heading text={"2. DEFINITIONS"}/>
              <p>For purposes of these Terms:</p>
              <p>
                "<strong>Customer"</strong> means a user who registers on the Platform to
                request, book, or receive services from Service Professionals.
              </p>
              <p>
                <strong>"Service Professional"</strong> or
                <strong>"Professional"</strong> means an individual or business entity
                that has been verified and approved by SabiWay to offer services to
                Customers through the Platform. Service categories include but are not
                limited to barbers, cleaners, electricians, plumbers, painters, and
                handymen.
              </p>
              <p>
                <strong>"User"</strong> means any person who accesses or uses the
                Platform, including Customers, Service Professionals, and Visitors.
              </p>
              <p>
                <strong>"Visitor"</strong> means a person who visits the Platform but does
                not register for an account or book services.
              </p>
              <p>
                <strong>"Content"</strong> means any text, images, photos, videos, audio,
                data, information, or other materials posted, uploaded, or transmitted on
                or through the Platform.
              </p>
              <p>
                <strong>"Services"</strong> means the platform services provided by
                SabiWay that enable Customers to connect with and book Service
                Professionals for various service categories.
              </p>
              <p>
                <strong>"Booking"</strong> means a confirmed arrangement between a
                Customer and a Service Professional for the provision of services.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* ELIGIBILITY AND ACCOUNT REGISTRATION */}
            <article id="eligibility">
              <Heading text={"3. ELIGIBILITY AND ACCOUNT REGISTRATION"}/>
              <p className="mt-2 mb-1"><strong>3.1 Age Requirements</strong></p>
              <p>
                You must be at least 18 years of age or the age of majority in your
                jurisdiction, whichever is greater, to use the Platform. By using the
                Platform, you represent and warrant that you meet this age requirement.
              </p>
              <p className="mt-2 mb-1"><strong>3.2 Account Registration</strong></p>
              <p>
                To access certain features of the Platform, you must register for an
                account. When registering, you agree to:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  Provide accurate, current, and complete information about yourself
                </li>
                <li>
                  Maintain and promptly update your account information to keep it
                  accurate and complete
                </li>
                <li>
                  Maintain the security and confidentiality of your account credentials
                </li>
                <li>
                  Immediately notify SabiWay of any unauthorized use of your account or
                  any other breach of security
                </li>
                <li>
                  Accept all responsibility for any activities that occur under your
                  account
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>3.3 Account Types</strong></p>
              <p>
                Customer Accounts: Customers must provide their name, email address, phone
                number, physical address, and payment information to create an account and
                book services.
              </p>
              <p>
                Service Professional Accounts: Service Professionals must complete a more
                extensive registration process, including:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  Personal and business information (name, company name, address, contact
                  details)
                </li>
                <li>Service categories and areas covered</li>
                <li>Professional licenses and certifications (where applicable)</li>
                <li>Background check authorization and completion</li>
                <li>Identity verification documents</li>
                <li>Tax information (tax ID, VAT number, or social insurance number)</li>
                <li>Bank account information for payment processing</li>
                <li>Business profile and portfolio (optional)</li>
              </ul>
              <p className="mt-2 mb-1"><strong>3.4 Account Suspension and Termination</strong></p>
              <p>
                SabiWay reserves the right to suspend or terminate your account at any
                time, with or without notice, for any reason, including but not limited
                to:
              </p>
              <ul className="list-disc ml-5">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Providing false or misleading information</li>
                <li>Failure to pay fees owed</li>
                <li>Complaints from other Users</li>
                <li>Inactivity for an extended period</li>
              </ul>
              <p>
                You may terminate your account at any time by contacting us at
                info@sabiway.com or through your Account Settings. Upon termination, your
                right to use the Platform will immediately cease.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* DESCRIPTION OF SERVICES */}
            <article id="description">
              <Heading text={"4. DESCRIPTION OF SERVICES"}/>
              <p className="mt-2 mb-1"><strong>4.1 Platform Overview</strong></p>
              <p>
                SabiWay is a people-based service platform that connects Customers with
                verified local Service Professionals across multiple categories. We
                provide the technology platform and tools that enable Users to:
              </p>
              <ul className="list-disc ml-5">
                <li>Search for and discover Service Professionals</li>
                <li>Request quotes and communicate with Service Professionals</li>
                <li>Book and schedule services</li>
                <li>Process payments securely</li>
                <li>Leave reviews and ratings</li>
                <li>Manage bookings and service history</li>
              </ul>
              <p className="mt-2 mb-1"><strong>4.2 SabiWay's Role</strong></p>
              <p>
                <strong>IMPORTANT:</strong> SabiWay is a technology platform that
                facilitates connections between Customers and independent Service
                Professionals. SabiWay does NOT:
              </p>
              <ul className="list-disc ml-5">
                <li>Employ Service Professionals</li>
                <li>
                  Provide the actual services (plumbing, electrical work, cleaning, etc.)
                </li>
                <li>
                  Supervise, direct, or control Service Professionals in the performance
                  of their services
                </li>
                <li>
                  Guarantee the quality, safety, or legality of services provided by
                  Service Professionals
                </li>
                <li>Act as an agent for Customers or Service Professionals</li>
              </ul>
              <p>
                Service Professionals are independent contractors who use the Platform to
                offer their services directly to Customers. The contractual relationship
                for services is between the Customer and the Service Professional, not
                with SabiWay.
              </p>
              <p className="mt-2 mb-1"><strong>4.3 No Endorsement</strong></p>
              <p>
                SabiWay does not endorse any Service Professional, Customer, or service.
                While we conduct background checks and verification processes, these do
                not constitute a guarantee of quality, safety, or reliability. Users are
                responsible for exercising their own judgment when selecting Service
                Professionals or accepting service requests.
              </p>
              <p className="mt-2 mb-1"><strong>4.4 Availability</strong></p>
              <p>
                We strive to maintain continuous availability of the Platform, but we do
                not guarantee uninterrupted or error-free operation. The Platform may be
                temporarily unavailable due to maintenance, updates, technical issues, or
                circumstances beyond our control.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* SERVICE PROFESSIONAL TERMS */}
            <article id="service">
              <Heading text={"5. SERVICE PROFESSIONAL TERMS"}/>
              <p className="mt-2 mb-1"><strong>5.1 Independent Contractor Status</strong></p>
              <p>
                Service Professionals are independent contractors and not employees,
                agents, partners, or joint venturers of SabiWay. Service Professionals:
              </p>
              <ul className="list-disc ml-5">
                <li>Control the manner and means of performing services</li>
                <li>Set their own schedules and availability</li>
                <li>Determine which service requests to accept or decline</li>
                <li>
                  Are responsible for their own taxes, insurance, licenses, and permits
                </li>
                <li>Are not entitled to employee benefits from SabiWay</li>
              </ul>
              <p className="mt-2 mb-1"><strong>5.2 Background Checks and Verification</strong></p>
              <p>
                All Service Professionals must undergo and pass background checks as
                required by applicable law. By registering as a Service Professional, you:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  Authorize SabiWay to conduct criminal background checks, identity
                  verification, and other screening processes
                </li>
                <li>
                  Consent to the collection and processing of information necessary for
                  such checks
                </li>
                <li>
                  Represent and warrant that all information provided is accurate and
                  complete
                </li>
                <li>
                  Acknowledge that you may be disqualified from the Platform based on
                  background check results
                </li>
              </ul>
              <p>Background checks may include but are not limited to:</p>
              <ul className="list-disc ml-5">
                <li>Criminal record checks</li>
                <li>Identity verification</li>
                <li>License and certification verification</li>
                <li>Reference checks</li>
                <li>Credit checks (where applicable)</li>
              </ul>
              <p>
                SabiWay reserves the right to re-run background checks periodically or
                when there is reason to believe information may have changed.
              </p>
              <p className="mt-2 mb-1"><strong>5.3 Professional Requirements</strong></p>
              <p className="mt-2 mb-1"><strong>Service Professionals must:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Possess all necessary licenses, permits, certifications, and insurance
                  required by applicable law for the services they offer
                </li>
                <li>
                  Maintain valid licenses and certifications throughout their use of the
                  Platform
                </li>
                <li>
                  Comply with all applicable laws, regulations, and industry standards
                </li>
                <li>Provide services in a professional, safe, and workmanlike manner</li>
                <li>
                  Use their own tools, equipment, and supplies unless otherwise agreed
                  with the Customer
                </li>
                <li>
                  Maintain adequate liability insurance and, where applicable, workers'
                  compensation insurance
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>5.4 Service Professional Obligations</strong></p>
              <p className="mt-2 mb-1"><strong>Service Professionals agree to:</strong></p>
              <ul className="list-disc ml-5">
                <li>Respond promptly to Customer inquiries and booking requests</li>
                <li>Honor confirmed Bookings and arrive on time</li>
                <li>Provide accurate quotes and pricing information</li>
                <li>
                  Communicate clearly with Customers about service scope, timeline, and
                  any issues
                </li>
                <li>Complete services to a reasonable standard of quality</li>
                <li>Respect Customer property and privacy</li>
                <li>Follow safety protocols and industry best practices</li>
                <li>Maintain a professional demeanor at all times</li>
              </ul>
              <p className="mt-2 mb-1"><strong>5.5 Prohibited Service Professional Conduct</strong></p>
              <p className="mt-2 mb-1"><strong>Service Professionals may NOT:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Accept payment outside the Platform for services booked through SabiWay
                </li>
                <li>Solicit Customers to book services outside the Platform</li>
                <li>Misrepresent their qualifications, experience, or credentials</li>
                <li>
                  Subcontract services to unverified third parties without Customer
                  consent
                </li>
                <li>Discriminate against Customers based on protected characteristics</li>
                <li>Engage in harassment, intimidation, or inappropriate behavior</li>
                <li>Provide services while under the influence of drugs or alcohol</li>
                <li>Take or use Customer property without permission</li>
                <li>Share Customer personal information with third parties</li>
              </ul>
              <p className="mt-2 mb-1"><strong>5.6 Service Professional Profile</strong></p>
              <p>
                <strong
                  >Your Service Professional profile will be publicly visible and may
                  include:</strong
                >
              </p>
              <ul className="list-disc ml-5">
                <li>Business name and description</li>
                <li>Service categories offered</li>
                <li>Service area and availability</li>
                <li>Profile photo and portfolio images</li>
                <li>Pricing information</li>
                <li>Ratings and reviews from Customers</li>
                <li>
                  Verification badges (e.g., "Background Check Verified," "License
                  Verified")
                </li>
                <li>Years of experience</li>
                <li>Completed job count</li>
              </ul>
              <p>
                You are responsible for keeping your profile information accurate,
                current, and professional.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* CUSTOMER TERMS */}
            <article id="customer">
              <Heading text={"6. CUSTOMER TERMS"}/>
              <p className="mt-2 mb-1"><strong>6.1 Booking Services</strong></p>
              <p>When you book a service through the Platform, you agree to:</p>
              <ul className="list-disc ml-5">
                <li>Provide accurate information about the service needed</li>
                <li>Be available at the agreed time and location</li>
                <li>Provide access to the work area as needed</li>
                <li>Pay the agreed price for services rendered</li>
                <li>Treat Service Professionals with respect and professionalism</li>
                <li>
                  Follow any reasonable instructions or safety guidelines provided by the
                  Service Professional
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>6.2 Customer Obligations</strong></p>
              <p className="mt-2 mb-1"><strong>Customers agree to:</strong></p>
              <ul className="list-disc ml-5">
                <li>Provide a safe working environment for Service Professionals</li>
                <li>
                  Disclose any known hazards or special conditions that may affect the
                  service
                </li>
                <li>
                  Be present or arrange for a representative to be present during the
                  service
                </li>
                <li>Inspect completed work promptly and communicate any concerns</li>
                <li>
                  Pay for services through the Platform unless otherwise agreed in writing
                </li>
                <li>
                  Not engage in discriminatory, harassing, or inappropriate behavior
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>6.3 Cancellations and Rescheduling</strong></p>
              <p>
                <strong
                  >Customers may cancel or reschedule Bookings subject to the
                  following:</strong
                >
              </p>
              <p className="mt-2 mb-1"><strong>Cancellation Policy:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Cancellations made more than 24 hours before the scheduled service: No
                  fee
                </li>
                <li>
                  Cancellations made less than 24 hours before the scheduled service: May
                  incur a cancellation fee of up to 50% of the estimated service cost
                </li>
                <li>
                  Cancellations made less than 2 hours before or no-shows: May incur a
                  cancellation fee of up to 100% of the estimated service cost
                </li>
              </ul>
              <p>
                Service Professionals may also cancel Bookings due to emergencies,
                unforeseen circumstances, or safety concerns. If a Service Professional
                cancels, you will not be charged.
              </p>
              <p className="mt-2 mb-1"><strong>6.4 Customer Prohibited Conduct</strong></p>
              <p className="mt-2 mb-1"><strong>Customers may NOT:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Use the Platform to book services with intent to harm, defraud, or
                  harass Service Professionals
                </li>
                <li>Request services that are illegal or violate these Terms</li>
                <li>Refuse payment for services properly rendered</li>
                <li>Provide false or misleading information in service requests</li>
                <li>Attempt to circumvent Platform payment systems</li>
                <li>
                  Solicit Service Professionals to provide services outside the Platform
                </li>
                <li>
                  Discriminate against Service Professionals based on protected
                  characteristics
                </li>
                <li>Record or photograph Service Professionals without consent</li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* PAYMENTS AND FEES */}
            <article id="payments">
              <Heading text={"7. PAYMENTS AND FEES"}/>
              <p className="mt-2 mb-1"><strong>7.1 Payment Processing</strong></p>
              <p>
                All payments for services booked through the Platform must be processed
                through SabiWay's secure payment system. We use third-party payment
                processors that comply with PCI-DSS standards. By using the Platform, you
                authorize SabiWay to charge your designated payment method for:
              </p>
              <ul className="list-disc ml-5">
                <li>Service fees charged by Service Professionals</li>
                <li>SabiWay platform fees</li>
                <li>Cancellation fees (if applicable)</li>
                <li>Any other fees disclosed at the time of booking</li>
              </ul>
              <p className="mt-2 mb-1"><strong>7.2 Pricing and Quotes</strong></p>
              <p>
                Service Professionals set their own pricing for services. Prices may be
                displayed as:
              </p>
              <ul className="list-disc ml-5">
                <li>Hourly rates</li>
                <li>Flat fees for specific services</li>
                <li>Custom quotes based on Customer requirements</li>
              </ul>
              <p>
                Quotes are estimates and may change based on the actual scope of work.
                Service Professionals should communicate any price changes to Customers
                before proceeding with additional work.
              </p>
              <p className="mt-2 mb-1"><strong>7.3 SabiWay Platform Fees</strong></p>
              <p>
                <strong>Customer Fees:</strong> Customers may be charged a service fee or
                booking fee for using the Platform. This fee will be clearly disclosed
                before you confirm a Booking.
              </p>
              <p>
                <strong>Service Professional Fees:</strong> Service Professionals are
                charged a commission or service fee on each completed Booking. The fee
                structure will be communicated during registration and may be adjusted
                with notice.
              </p>
              <p>
                All fees are non-refundable except as explicitly stated in these Terms or
                required by law.
              </p>
              <p className="mt-2 mb-1"><strong>7.4 Payment Terms</strong></p>
              <p className="mt-2 mb-1"><strong>For Customers:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Payment is due at the time of booking or upon service completion,
                  depending on the service type
                </li>
                <li>
                  Your payment method will be charged automatically after service
                  completion
                </li>
                <li>You are responsible for all charges incurred under your account</li>
                <li>
                  Payment includes the service cost, applicable taxes, and platform fees
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>For Service Professionals:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  You will receive payment for completed services minus SabiWay's
                  commission
                </li>
                <li>
                  Payments are processed and disbursed according to SabiWay's payment
                  schedule (typically within 3-7 business days after service completion)
                </li>
                <li>
                  You are responsible for reporting and paying all applicable taxes on
                  your earnings
                </li>
                <li>
                  SabiWay may withhold payment if there is a dispute, suspected fraud, or
                  violation of these Terms
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>7.5 Disputes and Refunds</strong></p>
              <p>If you have a dispute regarding payment or service quality:</p>
              <p>
                <strong>Step 1:</strong> Attempt to resolve the issue directly with the
                other party through the Platform's messaging system.
              </p>
              <p>
                <strong>Step 2:</strong> If unresolved, contact SabiWay customer support
                at info@sabiway.com within 7 days of service completion.
              </p>
              <p>
                <strong>Step 3:</strong> SabiWay will investigate and may, at its sole
                discretion:
              </p>
              <ul className="list-disc ml-5">
                <li>Facilitate communication between parties</li>
                <li>Issue a partial or full refund to the Customer</li>
                <li>Withhold payment to the Service Professional</li>
                <li>Take no action if the dispute is determined to be without merit</li>
              </ul>
              <p className="mt-2 mb-1"><strong>Refund Policy:</strong></p>
              <ul className="list-disc ml-5">
                <li>Refunds are issued at SabiWay's sole discretion</li>
                <li>Refunds may be full or partial depending on the circumstances</li>
                <li>Refunds are typically processed within 7-10 business days</li>
                <li>Platform fees are generally non-refundable</li>
              </ul>
              <p className="mt-2 mb-1"><strong>7.6 Taxes</strong></p>
              <p>
                You are responsible for all taxes associated with your use of the
                Platform:
              </p>
              <p>
                <strong>Customers:</strong> Applicable sales tax, VAT, or other
                consumption taxes may be added to your invoice.
              </p>
              <p>
                <strong>Service Professionals:</strong> You are solely responsible for
                determining, collecting, reporting, and remitting all applicable taxes on
                your earnings. SabiWay may provide tax documentation (e.g., 1099 forms in
                applicable jurisdictions) but does not provide tax advice.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* USER CONTENT AND CONDUCT */}
            <article id="user_content">
              <Heading text={"8. USER CONTENT AND CONDUCT"}/>
              <p className="mt-2 mb-1"><strong>8.1 User Content</strong></p>
              <p>
                Users may post, upload, or transmit Content on the Platform, including:
              </p>
              <ul className="list-disc ml-5">
                <li>Profile information and photos</li>
                <li>Service requests and quotes</li>
                <li>Messages and communications</li>
                <li>Reviews and ratings</li>
                <li>Portfolio images and work samples</li>
              </ul>
              <p>By posting Content on the Platform, you represent and warrant that:</p>
              <ul className="list-disc ml-5">
                <li>
                  You own or have the necessary rights to use and authorize SabiWay to use
                  the Content
                </li>
                <li>
                  Your Content does not violate any third-party rights (including
                  intellectual property, privacy, or publicity rights)
                </li>
                <li>Your Content complies with these Terms and applicable laws</li>
                <li>Your Content is accurate and not misleading</li>
              </ul>
              <p className="mt-2 mb-1"><strong>8.2 License to User Content</strong></p>
              <p>
                By posting Content on the Platform, you grant SabiWay a worldwide,
                non-exclusive, royalty-free, transferable, sublicensable license to use,
                reproduce, modify, adapt, publish, translate, create derivative works
                from, distribute, and display such Content in connection with operating
                and improving the Platform and promoting SabiWay's services.
              </p>
              <p>
                This license continues even if you stop using the Platform, but you may
                request removal of your Content by contacting us at info@sabiway.com.
              </p>
              <p className="mt-2 mb-1"><strong>8.3 Content Restrictions</strong></p>
              <p>You may NOT post Content that:</p>
              <ul className="list-disc ml-5">
                <li>
                  Is illegal, fraudulent, defamatory, obscene, pornographic, or offensive
                </li>
                <li>
                  Infringes intellectual property rights or other proprietary rights
                </li>
                <li>Contains viruses, malware, or other harmful code</li>
                <li>Violates anyone's privacy or publicity rights</li>
                <li>Harasses, threatens, or discriminates against others</li>
                <li>Impersonates another person or entity</li>
                <li>Contains false or misleading information</li>
                <li>Advertises or promotes competing services</li>
                <li>
                  Includes personal contact information (phone numbers, email addresses,
                  physical addresses) intended to circumvent the Platform
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>8.4 Community Guidelines</strong></p>
              <p className="mt-2 mb-1"><strong>All Users must:</strong></p>
              <ul className="list-disc ml-5">
                <li>Treat others with respect and professionalism</li>
                <li>Communicate clearly and honestly</li>
                <li>Respond promptly to inquiries and messages</li>
                <li>Honor commitments and agreements</li>
                <li>Report suspicious or inappropriate behavior</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect intellectual property rights</li>
                <li>
                  Maintain confidentiality of private information shared through the
                  Platform
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>8.5 Prohibited Conduct</strong></p>
              <p>In addition to Content restrictions, you may NOT:</p>
              <ul className="list-disc ml-5">
                <li>Use the Platform for any illegal purpose</li>
                <li>Attempt to circumvent security measures or access restrictions</li>
                <li>
                  Scrape, data mine, or use automated tools to collect information from
                  the Platform
                </li>
                <li>Interfere with or disrupt the Platform's operation</li>
                <li>Create multiple accounts to manipulate reviews or ratings</li>
                <li>Engage in fraudulent activity or money laundering</li>
                <li>Attempt to bypass SabiWay's payment system</li>
                <li>
                  Solicit business outside the Platform from Users you met through the
                  Platform
                </li>
                <li>Use another User's account without permission</li>
                <li>
                  Reverse engineer, decompile, or disassemble any aspect of the Platform
                </li>
                <li>Remove or modify any copyright, trademark, or proprietary notices</li>
              </ul>
              <p className="mt-2 mb-1"><strong>8.6 Consequences of Violations</strong></p>
              <p>Violation of these Terms may result in:</p>
              <ul className="list-disc ml-5">
                <li>Content removal</li>
                <li>Account suspension or termination</li>
                <li>Withholding of payments</li>
                <li>Legal action</li>
                <li>Reporting to law enforcement authorities</li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* REVIEWS AND RATINGS */}
            <article id="review">
              <Heading text={"9. REVIEWS AND RATINGS"}/>
              <p className="mt-2 mb-1"><strong>9.1 Review System</strong></p>
              <p>
                SabiWay provides a review and rating system to help Users make informed
                decisions. After a service is completed, Customers may leave a review and
                rating for the Service Professional.
              </p>
              <p className="mt-2 mb-1"><strong>9.2 Review Guidelines</strong></p>
              <p className="mt-2 mb-1"><strong>Reviews must:</strong></p>
              <ul className="list-disc ml-5">
                <li>Be based on your actual experience with the Service Professional</li>
                <li>Be honest, fair, and constructive</li>
                <li>Focus on the service quality and professionalism</li>
                <li>Comply with all Content restrictions in Section 8.3</li>
              </ul>
              <p className="mt-2 mb-1"><strong>Reviews must NOT:</strong></p>
              <ul className="list-disc ml-5">
                <li>Contain personal attacks, profanity, or discriminatory language</li>
                <li>Include personal information about the Service Professional</li>
                <li>Be submitted in exchange for compensation or incentives</li>
                <li>
                  Be posted by anyone other than the Customer who received the service
                </li>
                <li>Contain threats, blackmail, or extortion</li>
              </ul>
              <p className="mt-2 mb-1"><strong>9.3 Service Professional Responses</strong></p>
              <p>
                Service Professionals may respond to reviews to provide context, address
                concerns, or thank Customers. Responses must be professional and comply
                with these Terms.
              </p>
              <p className="mt-2 mb-1"><strong>9.4 Review Moderation</strong></p>
              <p>SabiWay reserves the right to:</p>
              <ul className="list-disc ml-5">
                <li>Remove reviews that violate these Terms</li>
                <li>Investigate reports of fake, fraudulent, or manipulated reviews</li>
                <li>Suspend or terminate accounts that abuse the review system</li>
                <li>Request additional information to verify reviews</li>
              </ul>
              <p className="mt-2 mb-1"><strong>9.5 Review Disputes</strong></p>
              <p>
                If you believe a review is false, misleading, or violates these Terms, you
                may report it to info@sabiway.com. SabiWay will investigate and take
                appropriate action, which may include:
              </p>
              <ul className="list-disc ml-5">
                <li>Removing the review</li>
                <li>Requesting additional information from the reviewer</li>
                <li>Taking no action if the review is determined to be legitimate</li>
              </ul>
              <p>
                <strong>Important:</strong> SabiWay does not arbitrate disputes about
                service quality or personal opinions expressed in reviews. We only remove
                reviews that clearly violate our Terms.
              </p>
              <p className="mt-2 mb-1"><strong>9.6 Editing and Deleting Reviews</strong></p>
              <p>
                Customers may edit or delete their reviews within 30 days of posting.
                After 30 days, reviews become permanent and cannot be edited or deleted
                except by SabiWay in accordance with these Terms.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* INTELLECTUAL PROPERTY */}
            <article id="intellectual">
              <Heading text={"10. INTELLECTUAL PROPERTY"}/>
              <p className="mt-2 mb-1"><strong>10.1 SabiWay's Intellectual Property</strong></p>
              <p>
                The Platform and all content, features, and functionality (including but
                not limited to design, text, graphics, logos, icons, images, audio clips,
                video clips, software, and source code) are owned by SabiWay or its
                licensors and are protected by copyright, trademark, patent, trade secret,
                and other intellectual property laws.
              </p>
              <p className="mt-2 mb-1"><strong>You may not:</strong></p>
              <ul className="list-disc ml-5">
                <li>Copy, modify, distribute, sell, or lease any part of the Platform</li>
                <li>
                  Reverse engineer or attempt to extract source code from the Platform
                </li>
                <li>
                  Use SabiWay's trademarks, logos, or branding without written permission
                </li>
                <li>Create derivative works based on the Platform</li>
                <li>Frame or mirror any part of the Platform on another website</li>
              </ul>
              <p className="mt-2 mb-1"><strong>10.2 Limited License</strong></p>
              <p>
                Subject to your compliance with these Terms, SabiWay grants you a limited,
                non-exclusive, non-transferable, non-sublicensable, revocable license to
                access and use the Platform for its intended purpose.
              </p>
              <p>This license does not include:</p>
              <ul className="list-disc ml-5">
                <li>Any resale or commercial use of the Platform</li>
                <li>
                  The collection or use of product listings, descriptions, or prices
                </li>
                <li>Any derivative use of the Platform or its contents</li>
                <li>
                  Any downloading or copying of account information for the benefit of
                  another merchant
                </li>
                <li>
                  Any use of data mining, robots, or similar data gathering and extraction
                  tools
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>10.3 Trademark Policy</strong></p>
              <p>
                "SabiWay" and related logos, graphics, and service names are trademarks of
                SabiWay LTD. You may not use our trademarks without our prior written
                consent.
              </p>
              <p className="mt-2 mb-1"><strong>10.4 Copyright Infringement</strong></p>
              <p>
                SabiWay respects the intellectual property rights of others and expects
                Users to do the same. If you believe that your copyrighted work has been
                copied in a way that constitutes copyright infringement on the Platform,
                please provide our copyright agent with the following information:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  An electronic or physical signature of the person authorized to act on
                  behalf of the copyright owner
                </li>
                <li>
                  A description of the copyrighted work that you claim has been infringed
                </li>
                <li>
                  A description of where the allegedly infringing material is located on
                  the Platform
                </li>
                <li>
                  Your contact information (address, telephone number, and email address)
                </li>
                <li>
                  A statement that you have a good faith belief that the disputed use is
                  not authorized by the copyright owner, its agent, or the law
                </li>
                <li>
                  A statement by you, made under penalty of perjury, that the above
                  information is accurate and that you are the copyright owner or
                  authorized to act on the copyright owner's behalf
                </li>
              </ul>
              <p>Send copyright infringement notices to:</p>
              <p>Email: info@sabiway.com</p>
              <p>Subject Line: DMCA Takedown Request</p>
              <p className="mt-2 mb-1"><strong>10.5 Counter-Notification</strong></p>
              <p>
                If you believe that Content you posted was removed in error, you may
                submit a counter-notification containing:
              </p>
              <ul className="list-disc ml-5">
                <li>Your physical or electronic signature</li>
                <li>
                  Identification of the Content that was removed and its location before
                  removal
                </li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief
                  that the Content was removed by mistake or misidentification
                </li>
                <li>Your name, address, telephone number, and email address</li>
                <li>
                  A statement that you consent to the jurisdiction of the Federal District
                  Court for the judicial district in which your address is located (or the
                  appropriate court in Nigeria if your address is outside Nigeria), and
                  that you will accept service of process from the person who provided the
                  original infringement notification.
                </li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* DISCLAIMERS AND LIMITATIONS OF LIABILITY */}
            <article id="disclaimers">
              <Heading text={"11. DISCLAIMERS AND LIMITATIONS OF LIABILITY"}/>
              <p className="mt-2 mb-1"><strong>11.1 No Warranties</strong></p>
              <p>
                THE PLATFORM AND ALL SERVICES PROVIDED THROUGH THE PLATFORM ARE PROVIDED
                ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED.
              </p>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SABIWAY DISCLAIMS ALL
                WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <p>
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT
              </p>
              <p>
                WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR AVAILABILITY OF THE
                PLATFORM
              </p>
              <p>
                WARRANTIES THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE
              </p>
              <p>
                WARRANTIES REGARDING THE QUALITY, SAFETY, OR LEGALITY OF SERVICES PROVIDED
                BY SERVICE PROFESSIONALS
              </p>
              <p>
                WARRANTIES THAT SERVICE PROFESSIONALS HAVE PROPER LICENSES, INSURANCE, OR
                QUALIFICATIONS
              </p>
              <p>WARRANTIES REGARDING THE CONDUCT OF USERS</p>
              <p>SabiWay does not warrant that:</p>
              <ul className="list-disc ml-5">
                <li>The Platform will meet your requirements</li>
                <li>The Platform will be available at any particular time or location</li>
                <li>Any defects or errors will be corrected</li>
                <li>The Platform is free of viruses or other harmful components</li>
                <li>
                  Results obtained from using the Platform will be accurate or reliable
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>11.2 Service Professional Disclaimer</strong></p>
              <p>
                SABIWAY IS NOT RESPONSIBLE FOR THE CONDUCT, ACTIONS, OR OMISSIONS OF
                SERVICE PROFESSIONALS. SERVICE PROFESSIONALS ARE INDEPENDENT CONTRACTORS,
                NOT EMPLOYEES OR AGENTS OF SABIWAY.
              </p>
              <p>SabiWay does not:</p>
              <ul className="list-disc ml-5">
                <li>Employ or supervise Service Professionals</li>
                <li>Control how Service Professionals perform their services</li>
                <li>
                  Guarantee the quality, safety, timeliness, or legality of services
                  provided by Service Professionals
                </li>
                <li>
                  Verify that Service Professionals have adequate insurance or bonding
                </li>
                <li>
                  Train Service Professionals or establish service standards (beyond
                  requiring compliance with applicable laws)
                </li>
                <li>
                  Conduct ongoing supervision or monitoring of Service Professionals' work
                </li>
              </ul>
              <p>
                While SabiWay conducts background checks and verification processes, these
                do not constitute:
              </p>
              <ul className="list-disc ml-5">
                <li>A guarantee of competence, safety, or reliability</li>
                <li>A comprehensive investigation of Service Professionals' history</li>
                <li>An endorsement or recommendation of any Service Professional</li>
                <li>
                  A warranty that Service Professionals will perform services
                  satisfactorily
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>11.3 Third-Party Services</strong></p>
              <p>
                The Platform may contain links to third-party websites, applications, or
                services. SabiWay is not responsible for:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  The availability, content, or practices of third-party websites or
                  services
                </li>
                <li>Any damages or losses caused by your use of third-party services</li>
                <li>The privacy practices of third parties</li>
              </ul>
              <p>
                Your use of third-party services is at your own risk and subject to their
                terms and conditions.
              </p>
              <p className="mt-2 mb-1"><strong>11.4 Limitation of Liability</strong></p>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
                SABIWAY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, OR
                LICENSORS BE LIABLE FOR:
              </p>
              <p>
                <strong>A. INDIRECT DAMAGES:</strong> Any indirect, incidental, special,
                consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc ml-5">
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Loss of data or goodwill</li>
                <li>Cost of substitute services</li>
                <li>Personal or property damage</li>
                <li>Emotional distress</li>
              </ul>
              <p>
                <strong>B. DIRECT DAMAGES EXCEEDING:</strong> An amount equal to the
                greater of (i) the fees paid by you to SabiWay in the 12 months preceding
                the event giving rise to the liability, or (ii) NGN 150,000 (or USD $100
                equivalent).
              </p>
              <p>This limitation applies regardless of:</p>
              <ul className="list-disc ml-5">
                <li>
                  The legal theory on which the claim is based (contract, tort,
                  negligence, strict liability, or otherwise)
                </li>
                <li>Whether SabiWay was advised of the possibility of such damages</li>
                <li>
                  Whether the limited remedies provided herein fail of their essential
                  purpose
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>11.5 Specific Situations Where SabiWay Is Not Liable</strong></p>
              <p>SabiWay is not liable for:</p>
              <p className="mt-2 mb-1"><strong>Service-Related Issues:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Quality, safety, or legality of services provided by Service
                  Professionals
                </li>
                <li>
                  Failure of Service Professionals to appear, arrive on time, or complete
                  services
                </li>
                <li>
                  Property damage or personal injury caused by Service Professionals
                </li>
                <li>Disputes between Customers and Service Professionals</li>
                <li>Services that do not meet your expectations</li>
              </ul>
              <p>Platform Issues:</p>
              <ul className="list-disc ml-5">
                <li>Technical failures, interruptions, or errors</li>
                <li>Unauthorized access to your account or data</li>
                <li>Loss of data or content</li>
                <li>Compatibility issues with your devices or software</li>
              </ul>
              <p>User Actions:</p>
              <ul className="list-disc ml-5">
                <li>Content posted by Users</li>
                <li>Conduct or actions of Users</li>
                <li>Transactions or agreements made outside the Platform</li>
                <li>Failure to read or understand these Terms</li>
              </ul>
              <p>External Factors:</p>
              <ul className="list-disc ml-5">
                <li>Acts of God, natural disasters, or force majeure events</li>
                <li>Actions of third parties, including hackers or fraudsters</li>
                <li>Changes in laws or regulations</li>
                <li>Issues with third-party payment processors or service providers</li>
              </ul>
              <p className="mt-2 mb-1"><strong>11.6 Exceptions</strong></p>
              <p>
                Some jurisdictions do not allow the exclusion of certain warranties or the
                limitation or exclusion of liability for certain types of damages.
                Therefore, some of the limitations above may not apply to you. In such
                jurisdictions, our liability will be limited to the greatest extent
                permitted by law.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* INDEMNIFICATION */}
            <article id="indemnification">
              <Heading text={"12. INDEMNIFICATION"}/>
              <p className="mt-2 mb-1"><strong>12.1 Your Indemnification Obligations</strong></p>
              <p>
                You agree to indemnify, defend, and hold harmless SabiWay, its parent
                company, subsidiaries, affiliates, officers, directors, employees, agents,
                partners, and licensors (collectively, the "SabiWay Parties") from and
                against any and all claims, liabilities, damages, losses, costs, expenses,
                or fees (including reasonable attorneys' fees and court costs) arising
                from or relating to:
              </p>
              <p className="mt-2 mb-1"><strong>A. Your Use of the Platform:</strong></p>
              <ul className="list-disc ml-5">
                <li>Your violation of these Terms</li>
                <li>
                  Your violation of any rights of another party, including other Users
                </li>
                <li>Your violation of any applicable law, regulation, or ordinance</li>
                <li>
                  Your Content or any content you post, upload, or transmit through the
                  Platform
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>B. Services Provided or Received:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  <strong>For Service Professionals:</strong> Services you provide to
                  Customers, including any claims of negligence, property damage, personal
                  injury, or breach of contract
                </li>
                <li>
                  <strong>For Customers:</strong> Your interactions with Service
                  Professionals, including any false claims or unwarranted disputes
                </li>
                <li>Any tax liability arising from your use of the Platform</li>
              </ul>
              <p className="mt-2 mb-1"><strong>C. Your Conduct:</strong></p>
              <ul className="list-disc ml-5">
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Infringement of intellectual property rights</li>
                <li>Violation of privacy rights or data protection laws</li>
                <li>Harassment or discrimination against other Users</li>
              </ul>
              <p className="mt-2 mb-1"><strong>D. Third-Party Claims:</strong></p>
              <ul className="list-disc ml-5">
                <li>Claims by third parties arising from your use of the Platform</li>
                <li>
                  Claims by employees, contractors, or agents you engage in connection
                  with services
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>12.2 Defense and Settlement</strong></p>
              <p>
                SabiWay reserves the right, at its own expense, to assume the exclusive
                defense and control of any matter subject to indemnification by you. You
                agree to cooperate with SabiWay's defense of such claims. You may not
                settle any claim that affects SabiWay without SabiWay's prior written
                consent.
              </p>
              <p className="mt-2 mb-1"><strong>12.3 Service Professional Additional Indemnification</strong></p>
              <p>
                If you are a Service Professional, you specifically agree to indemnify
                SabiWay for:
              </p>
              <ul className="list-disc ml-5">
                <li>Claims arising from your failure to maintain adequate insurance</li>
                <li>
                  Claims that you are an employee of SabiWay rather than an independent
                  contractor
                </li>
                <li>
                  Claims arising from your failure to comply with licensing or regulatory
                  requirements
                </li>
                <li>Claims by your employees, contractors, or subcontractors</li>
                <li>Workers' compensation claims</li>
                <li>Claims arising from your misclassification of workers</li>
                <li>Tax liabilities related to your earnings through the Platform</li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* DISPUTE RESOLUTION */}
            <article id="dispute">
              <Heading text={"13. DISPUTE RESOLUTION"}/>
              <p className="mt-2 mb-1"><strong>13.1 Informal Resolution</strong></p>
              <p>
                Before filing a formal claim, you agree to first contact SabiWay at
                info@sabiway.com to attempt to resolve the dispute informally. Please
                provide:
              </p>
              <ul className="list-disc ml-5">
                <li>Your name and contact information</li>
                <li>A description of the dispute</li>
                <li>The relief you are seeking</li>
              </ul>
              <p>
                We will attempt to resolve the dispute within 30 days of receiving your
                notice.
              </p>
              <p className="mt-2 mb-1"><strong>13.2 Governing Law</strong></p>
              <p>
                These Terms and any disputes arising from or relating to the Platform
                shall be governed by and construed in accordance with the laws of the
                Federal Republic of Nigeria, without regard to its conflict of law
                provisions.
              </p>
              <p className="mt-2 mb-1"><strong>13.3 Arbitration Agreement</strong></p>
              <p>
                PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS,
                INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
              </p>
              <p>
                Except for disputes that qualify for small claims court or disputes
                relating to intellectual property rights, any dispute, claim, or
                controversy arising out of or relating to these Terms or the Platform
                (collectively, "Disputes") shall be resolved through binding arbitration
                rather than in court.
              </p>
              <p className="mt-2 mb-1"><strong>Arbitration Procedures:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Disputes shall be resolved by arbitration administered by the Lagos
                  Multi-Door Courthouse (LMDC) or another mutually agreed arbitration body
                </li>
                <li>
                  The arbitration shall be conducted in accordance with the Arbitration
                  and Mediation Act of Nigeria
                </li>
                <li>
                  The arbitration shall take place in Lagos, Nigeria, or another mutually
                  agreed location
                </li>
                <li>The arbitrator's decision shall be final and binding</li>
                <li>
                  Judgment on the arbitration award may be entered in any court having
                  jurisdiction
                </li>
              </ul>
              <p>Exceptions to Arbitration:</p>
              <p>The following disputes are not subject to arbitration:</p>
              <ul className="list-disc ml-5">
                <li>Disputes that may be brought in small claims court</li>
                <li>
                  Disputes relating to intellectual property rights (copyright, trademark,
                  patent, trade secret)
                </li>
                <li>Requests for injunctive relief to prevent irreparable harm</li>
              </ul>
              <p>
                <strong>Class Action Waiver: </strong>YOU AND SABIWAY AGREE THAT DISPUTES
                WILL BE RESOLVED ON AN INDIVIDUAL BASIS ONLY, NOT AS A CLASS ACTION,
                CONSOLIDATED ACTION, OR REPRESENTATIVE ACTION. You and SabiWay expressly
                waive any right to bring or participate in a class action, consolidated
                action, or representative action.
              </p>
              <p>
                <strong>Opt-Out Right: </strong>You have the right to opt out of this
                arbitration agreement by sending written notice to SabiWay at
                legal@sabiway.com within 30 days of first accepting these Terms. Your
                notice must include your name, address, and a clear statement that you
                wish to opt out of the arbitration agreement. If you opt out, you and
                SabiWay agree that disputes will be resolved in court as described in
                Section 13.4 below.
              </p>
              <p className="mt-2 mb-1"><strong>13.4 Jurisdiction and Venue</strong></p>
              <p>
                If the arbitration agreement does not apply (either because you opted out
                or the dispute is excluded from arbitration), you agree that any legal
                action, suit, or proceeding arising out of or relating to these Terms or
                the Platform shall be brought exclusively in the courts located in Lagos
                State, Nigeria. You consent to the personal jurisdiction of such courts
                and waive any objection to the venue.
              </p>
              <p className="mt-2 mb-1"><strong>13.5 Time Limitation on Claims</strong></p>
              <p>
                You agree that regardless of any statute or law to the contrary, any claim
                or cause of action arising out of or related to your use of the Platform
                must be filed within one (1) year after such claim or cause of action
                arose, or be forever barred.
              </p>
              <p className="mt-2 mb-1"><strong>13.6 Customer-Service Professional Disputes</strong></p>
              <p>
                Disputes between Customers and Service Professionals regarding services,
                payments, or conduct should first be addressed directly between the
                parties through the Platform's messaging system.
              </p>
              <p>
                If direct resolution is unsuccessful, either party may contact SabiWay
                customer support at info@sabiway.com for assistance. SabiWay may, at its
                sole discretion:
              </p>
              <ul className="list-disc ml-5">
                <li>Facilitate communication between the parties</li>
                <li>Provide non-binding recommendations</li>
                <li>Issue refunds or adjust payments</li>
                <li>Take action against a User's account</li>
              </ul>
              <p>
                However, SabiWay is not obligated to resolve disputes between Users and
                does not act as an arbitrator or judge in such disputes.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* TERM AND TERMINATION */}
            <article id="termination">
              <Heading text={"14. TERM AND TERMINATION"}/>
              <p className="mt-2 mb-1"><strong>14.1 Term</strong></p>
              <p>
                These Terms commence when you first access the Platform and continue until
                terminated by either you or SabiWay.
              </p>
              <p className="mt-2 mb-1"><strong>14.2 Termination by You</strong></p>
              <p>You may terminate your account at any time by:</p>
              <ul className="list-disc ml-5">
                <li>Sending a termination request to info@sabiway.com</li>
                <li>
                  Using the account deletion feature in your Account Settings (if
                  available)
                </li>
              </ul>
              <p>Upon termination, you remain obligated to:</p>
              <ul className="list-disc ml-5">
                <li>Complete any outstanding Bookings</li>
                <li>Pay any outstanding fees or charges</li>
                <li>
                  Comply with any provisions of these Terms that by their nature should
                  survive termination
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>14.3 Termination by SabiWay</strong></p>
              <p>
                SabiWay may suspend or terminate your account immediately, with or without
                notice, for any reason, including but not limited to:
              </p>
              <ul className="list-disc ml-5">
                <li>Violation of these Terms</li>
                <li>Fraudulent, illegal, or abusive behavior</li>
                <li>Failure to pay fees or charges</li>
                <li>Providing false or misleading information</li>
                <li>Receipt of complaints from other Users</li>
                <li>
                  Engagement in conduct that harms or could harm SabiWay, the Platform, or
                  other Users
                </li>
                <li>Inactivity for an extended period (typically 2 years)</li>
                <li>At our sole discretion for any other reason</li>
              </ul>
              <p className="mt-2 mb-1"><strong>14.4 Effects of Termination</strong></p>
              <p>Upon termination of your account:</p>
              <p className="mt-2 mb-1"><strong>Immediate Effects:</strong></p>
              <ul className="list-disc ml-5">
                <li>Your access to the Platform will be revoked</li>
                <li>Your profile will no longer be visible to other Users</li>
                <li>
                  You will not be able to accept new Bookings (Service Professionals) or
                  make new Bookings (Customers)
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>Outstanding Obligations:</strong></p>
              <ul className="list-disc ml-5">
                <li>You remain responsible for completing any confirmed Bookings</li>
                <li>You must pay any outstanding fees or charges</li>
                <li>
                  Service Professionals will receive payment for completed services (minus
                  any amounts withheld for violations)
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>Content:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Your Content may remain on the Platform, including reviews and ratings
                </li>
                <li>
                  SabiWay may retain certain information as required by law or for
                  legitimate business purposes
                </li>
                <li>
                  You may request deletion of your personal information as described in
                  our Privacy Policy
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>No Refunds:</strong></p>
              <ul className="list-disc ml-5">
                <li>Termination does not entitle you to refunds of any fees paid</li>
                <li>
                  SabiWay is not liable for any damages resulting from account suspension
                  or termination
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>14.5 Survival</strong></p>
              <p>The following provisions survive termination of these Terms:</p>
              <ul style={{padding: "0px", margin: "0px"}}>
                <li>
                  Sections 7 (Payments and Fees), 8.2 (License to User Content), 10
                  (Intellectual Property), 11 (Disclaimers and Limitations of Liability),
                  12 (Indemnification), 13 (Dispute Resolution), 14.4 (Effects of
                  Termination), and any other provisions that by their nature should
                  survive
                </li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* PRIVACY AND DATA PROTECTION */}
            <article id="privacy">
              <Heading text={"15. PRIVACY AND DATA PROTECTION"}/>
              <p className="mt-2 mb-1"><strong>15.1 Privacy Policy</strong></p>
              <p>
                Your privacy is important to us. Our collection, use, and disclosure of
                your personal information is governed by our Privacy Policy, which is
                incorporated into these Terms by reference.
              </p>
              <p>By using the Platform, you consent to:</p>
              <ul className="list-disc ml-5">
                <li>
                  The collection and use of your information as described in the Privacy
                  Policy
                </li>
                <li>
                  The transfer of your information to Nigeria and other countries where
                  SabiWay operates
                </li>
                <li>The use of cookies and similar tracking technologies</li>
              </ul>
              <p className="mt-2 mb-1"><strong>15.2 Data You Provide</strong></p>
              <p>
                You are responsible for the accuracy of information you provide to
                SabiWay. You agree to keep your information current and accurate.
              </p>
              <p className="mt-2 mb-1"><strong>15.3 Communications</strong></p>
              <p>
                By creating an account, you consent to receive communications from
                SabiWay, including:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  Transactional messages (booking confirmations, payment receipts, etc.)
                </li>
                <li>Service-related announcements</li>
                <li>Customer support responses</li>
                <li>Platform updates and changes</li>
                <li>Marketing communications (you may opt out of these)</li>
              </ul>
              <p>
                You may manage your communication preferences in your Account Settings or
                by following the unsubscribe instructions in emails.
              </p>
              <p className="mt-2 mb-1"><strong>15.4 Data Security</strong></p>
              <p>
                While we implement reasonable security measures to protect your
                information, no method of transmission or storage is 100% secure. You use
                the Platform at your own risk.
              </p>
              <p>You are responsible for:</p>
              <ul className="list-disc ml-5">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>Any activity that occurs under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* INSURANCE AND LIABILITY COVERAGE */}
            <article id="insurance">
              <Heading text={"16. INSURANCE AND LIABILITY COVERAGE"}/>
              <p className="mt-2 mb-1"><strong>16.1 Service Professional Insurance Requirements</strong></p>
              <p>
                Service Professionals are strongly encouraged to maintain adequate
                insurance coverage, including:
              </p>
              <ul className="list-disc ml-5">
                <li>General liability insurance</li>
                <li>Professional liability insurance (errors and omissions)</li>
                <li>Workers' compensation insurance (if employing others)</li>
                <li>Commercial auto insurance (if using vehicles for business)</li>
                <li>
                  Any other insurance required by applicable law or industry standards
                </li>
              </ul>
              <p>
                <strong>Important:</strong> SabiWay does not provide insurance coverage
                for Service Professionals. Service Professionals are solely responsible
                for obtaining and maintaining adequate insurance.
              </p>
              <p className="mt-2 mb-1"><strong>16.2 Customer Responsibility</strong></p>
              <p>Customers are responsible for:</p>
              <ul className="list-disc ml-5">
                <li>
                  Verifying that Service Professionals have adequate insurance for the
                  services being provided
                </li>
                <li>Understanding that SabiWay does not insure or guarantee services</li>
                <li>
                  Maintaining their own homeowner's, renter's, or other applicable
                  insurance
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>16.3 Claims and Damages</strong></p>
              <p>In the event of property damage, personal injury, or other losses:</p>
              <p>
                <strong>Step 1:</strong> Document the incident with photos, written
                descriptions, and any other relevant evidence.
              </p>
              <p>
                <strong>Step 2:</strong> Report the incident to SabiWay at
                info@sabiway.com within 48 hours.
              </p>
              <p>
                <strong>Step 3:</strong> If the Service Professional has insurance, file a
                claim with their insurance provider.
              </p>
              <p>
                <strong>Step 4:</strong> If applicable, file a claim with your own
                insurance provider.
              </p>
              <p>
                <strong>SabiWay's Role</strong>: SabiWay may assist with communication and
                documentation but is not responsible for resolving insurance claims or
                compensating for damages. Any disputes regarding damages must be resolved
                between the parties involved (and their insurance providers), or through
                the dispute resolution process outlined in Section 13.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* BACKGROUND CHECKS AND SAFETY */}
            <article id="background">
              <Heading text={"17. BACKGROUND CHECKS AND SAFETY"}/>
              <p className="mt-2 mb-1"><strong>17.1 Background Check Process</strong></p>
              <p>
                SabiWay conducts background checks on Service Professionals as part of the
                verification process. These checks may include:
              </p>
              <ul className="list-disc ml-5">
                <li>Criminal history checks</li>
                <li>Identity verification</li>
                <li>License and certification verification</li>
                <li>Reference checks</li>
                <li>Credit checks (where applicable and permitted by law)</li>
              </ul>
              <p className="mt-2 mb-1"><strong>17.2 Limitations of Background Checks</strong></p>
              <p>
                <strong>Important Disclaimer</strong>: Background checks have limitations
                and do not guarantee safety, competence, or reliability. Background checks
                may not reveal:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  Recent criminal activity that has not yet been reported or processed
                </li>
                <li>Criminal activity in jurisdictions not covered by the check</li>
                <li>Civil judgments, complaints, or disputes</li>
                <li>Poor work quality or customer service issues</li>
                <li>Financial instability or business failures</li>
              </ul>
              <p className="mt-2 mb-1"><strong>17.3 Continuous Monitoring</strong></p>
              <p>
                SabiWay may conduct periodic re-checks of Service Professionals'
                backgrounds. However, we do not provide real-time or continuous
                monitoring.
              </p>
              <p className="mt-2 mb-1"><strong>17.4 User Safety Responsibilities</strong></p>
              <p>Users are responsible for their own safety. We recommend:</p>
              <p className="mt-2 mb-1"><strong>For Customers:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Meet Service Professionals in well-lit, public areas when possible
                </li>
                <li>Ensure someone knows when and where services are being performed</li>
                <li>
                  Trust your instincts and decline services if you feel uncomfortable
                </li>
                <li>Verify credentials and ask for references</li>
                <li>Review the Service Professional's ratings and reviews</li>
                <li>Report suspicious behavior immediately</li>
              </ul>
              <p className="mt-2 mb-1"><strong>For Service Professionals:</strong></p>
              <ul className="list-disc ml-5">
                <li>
                  Assess the safety of the work environment before accepting a Booking
                </li>
                <li>Decline Bookings if you feel unsafe</li>
                <li>Bring appropriate safety equipment</li>
                <li>Report threatening or inappropriate behavior immediately</li>
                <li>Meet Customers in the presence of others when possible</li>
              </ul>
              <p className="mt-2 mb-1"><strong>17.5 Reporting Safety Concerns</strong></p>
              <p>If you experience or witness any safety concerns, including:</p>
              <ul className="list-disc ml-5">
                <li>Threats of violence or actual violence</li>
                <li>Sexual harassment or assault</li>
                <li>Theft or property damage</li>
                <li>Impersonation or fraud</li>
                <li>Any behavior that makes you feel unsafe</li>
              </ul>
              <p>
                <strong>Immediate Danger:</strong> Call local emergency services (police,
                fire, medical) immediately.
              </p>
              <p>
                <strong>After the Incident</strong>: Report the incident to SabiWay at
                safety@sabiway.com or info@sabiway.com as soon as possible. Include:
              </p>
              <ul className="list-disc ml-5">
                <li>Date, time, and location of the incident</li>
                <li>Names and contact information of parties involved</li>
                <li>Detailed description of what occurred</li>
                <li>Any photos, videos, or other evidence</li>
                <li>Whether you reported it to law enforcement</li>
              </ul>
              <p>
                SabiWay takes safety reports seriously and will investigate promptly.
                Depending on the circumstances, we may:
              </p>
              <ul className="list-disc ml-5">
                <li>Suspend or terminate the offending User's account</li>
                <li>Contact law enforcement</li>
                <li>Cooperate with legal investigations</li>
                <li>Implement additional safety measures</li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* MODIFICATIONS TO TERMS */}
            <article id="modifications">
              <Heading text={"18. MODIFICATIONS TO TERMS"}/>
              <p className="mt-2 mb-1"><strong>18.1 Right to Modify</strong></p>
              <p>
                SabiWay reserves the right to modify these Terms at any time, at our sole
                discretion. When we make changes, we will:
              </p>
              <ul className="list-disc ml-5">
                <li>Update the "Last Updated" date at the top of these Terms</li>
                <li>Post the revised Terms on the Platform</li>
                <li>
                  Notify you of material changes through email, Platform notification, or
                  other reasonable means
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>18.2 Your Acceptance of Changes</strong></p>
              <p>
                <strong>Material Changes:</strong> For material changes that significantly
                affect your rights or obligations, we will provide at least 30 days'
                notice before the changes take effect. You may choose to:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  Accept the changes by continuing to use the Platform after the effective
                  date
                </li>
                <li>
                  Reject the changes by terminating your account before the effective date
                </li>
              </ul>
              <p>
                <strong>Non-Material Changes:</strong> For minor changes (such as
                clarifications, formatting, or non-substantive updates), your continued
                use of the Platform after the changes are posted constitutes your
                acceptance of the revised Terms.
              </p>
              <p className="mt-2 mb-1"><strong>18.3 Checking for Updates</strong></p>
              <p>
                It is your responsibility to review these Terms periodically for changes.
                Your continued use of the Platform following the posting of changes
                constitutes your acceptance of those changes.
              </p>
              <p>
                If you do not agree to the modified Terms, you must stop using the
                Platform and terminate your account.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* GENERAL PROVISIONS */}
            <article id="general">
              <Heading text={"19. GENERAL PROVISIONS"}/>
              <p className="mt-2 mb-1"><strong>19.1 Entire Agreement</strong></p>
              <p>
                These Terms, together with our Privacy Policy and any other policies or
                guidelines posted on the Platform, constitute the entire agreement between
                you and SabiWay regarding your use of the Platform and supersede all prior
                agreements, understandings, and representations, whether written or oral.
              </p>
              <p className="mt-2 mb-1"><strong>19.2 Severability</strong></p>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or
                unenforceable by a court of competent jurisdiction, such provision shall
                be modified to the minimum extent necessary to make it valid and
                enforceable, or if such modification is not possible, the provision shall
                be severed from these Terms. The remaining provisions shall continue in
                full force and effect.
              </p>
              <p className="mt-2 mb-1"><strong>19.3 Waiver</strong></p>
              <p>
                No waiver of any provision of these Terms shall be deemed a further or
                continuing waiver of such provision or any other provision. SabiWay's
                failure to enforce any right or provision of these Terms shall not
                constitute a waiver of such right or provision.
              </p>
              <p className="mt-2 mb-1"><strong>19.4 Assignment</strong></p>
              <p>
                You may not assign, transfer, or delegate these Terms or your rights and
                obligations hereunder without SabiWay's prior written consent. SabiWay may
                assign these Terms or any rights hereunder without your consent, including
                in connection with a merger, acquisition, reorganization, or sale of
                assets.
              </p>
              <p className="mt-2 mb-1"><strong>19.5 Force Majeure</strong></p>
              <p>
                SabiWay shall not be liable for any delay or failure to perform resulting
                from causes outside its reasonable control, including but not limited to:
              </p>
              <ul className="list-disc ml-5">
                <li>Acts of God, natural disasters, or extreme weather</li>
                <li>War, terrorism, civil unrest, or government action</li>
                <li>Labor disputes or strikes</li>
                <li>Epidemics or pandemics</li>
                <li>Internet or telecommunications failures</li>
                <li>Cyber attacks or data breaches</li>
                <li>Failure of third-party service providers</li>
              </ul>
              <p className="mt-2 mb-1"><strong>19.6 No Third-Party Beneficiaries</strong></p>
              <p>
                These Terms are for the benefit of, and may be enforced only by, you and
                SabiWay. These Terms are not intended to confer any right or benefit on
                any third party.
              </p>
              <p className="mt-2 mb-1"><strong>19.7 Relationship of the Parties</strong></p>
              <p>
                Nothing in these Terms creates a partnership, joint venture, employment,
                agency, or franchise relationship between you and SabiWay. You have no
                authority to bind SabiWay or make commitments on SabiWay's behalf.
              </p>
              <p className="mt-2 mb-1"><strong>19.8 Language</strong></p>
              <p>
                These Terms are drafted in English. If these Terms are translated into
                another language, the English version shall prevail in case of any
                conflict or inconsistency.
              </p>
              <p className="mt-2 mb-1"><strong>19.9 Headings</strong></p>
              <p>
                The section headings in these Terms are for convenience only and have no
                legal or contractual effect.
              </p>
              <p className="mt-2 mb-1"><strong>19.10 Notices</strong></p>
              <p>To You: SabiWay may provide notices to you:</p>
              <ul className="list-disc ml-5">
                <li>By email to the address associated with your account</li>
                <li>By posting on the Platform</li>
                <li>Through push notifications or SMS</li>
                <li>By mail to the address on file</li>
              </ul>
              <p>
                You consent to receive notices electronically, and electronic notices
                satisfy any legal requirement that notices be in writing.
              </p>
              <p>To SabiWay: You may provide notice to SabiWay at:</p>
              <p>Email: info@sabiway.com</p>
              <p>Mailing Address:</p>
              <p>SabiWay LTD</p>
              <p>75, VILLAGE DRIVE, PRESTON</p>
              <p>UNITED KINGDOM</p>
              <p>
                Notices to SabiWay must be in writing and will be deemed given when
                received by SabiWay.
              </p>
              <p className="mt-2 mb-1"><strong>19.11 Export Controls</strong></p>
              <p>
                The Platform may be subject to export control and economic sanctions laws
                of UK, Nigeria, the United States, and other jurisdictions. You represent
                and warrant that:
              </p>
              <ul className="list-disc ml-5">
                <li>
                  You are not located in, under the control of, or a national or resident
                  of any country subject to comprehensive economic sanctions
                </li>
                <li>
                  You are not listed on any government list of prohibited or restricted
                  parties
                </li>
                <li>
                  You will comply with all applicable export control and sanctions laws
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>19.12 Government Users</strong></p>
              <p>
                If you are a government entity, your use of the Platform is subject to
                these Terms except to the extent that any provision is inconsistent with
                applicable law or regulations governing your entity.
              </p>
              <p className="mt-2 mb-1"><strong>19.13 Electronic Signatures</strong></p>
              <p>
                Your use of the Platform and acceptance of these Terms constitutes your
                electronic signature and your agreement to be bound by these Terms. You
                waive any rights or requirements under any laws or regulations in any
                jurisdiction that require an original (non-electronic) signature or
                delivery or retention of non-electronic records.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* SPECIFIC TERMS FOR SERVICE CATEGORIES */}
            <article id="specific_terms">
              <Heading text={"20. SPECIFIC TERMS FOR SERVICE CATEGORIES"}/>
              <p className="mt-2 mb-1"><strong>20.1 Licensed Professionals</strong></p>
              <p>
                For services that require professional licenses (e.g., electricians,
                plumbers), Service Professionals must:
              </p>
              <ul className="list-disc ml-5">
                <li>Maintain all required licenses in good standing</li>
                <li>Comply with all applicable codes, standards, and regulations</li>
                <li>Carry appropriate professional liability insurance</li>
                <li>Perform work in accordance with industry best practices</li>
                <li>Obtain necessary permits for work performed</li>
                <li>Provide warranty or guarantee as required by law</li>
              </ul>
              <p className="mt-2 mb-1"><strong>20.2 Health and Beauty Services</strong></p>
              <p>
                For services such as barbering, cosmetology, or other personal care
                services, Service Professionals must:
              </p>
              <ul className="list-disc ml-5">
                <li>Maintain all required health and sanitation permits</li>
                <li>Use clean, sanitized tools and equipment</li>
                <li>Follow infection control protocols</li>
                <li>Disclose any health conditions that may affect service delivery</li>
                <li>Respect client privacy and modesty</li>
                <li>Maintain professional boundaries at all times</li>
              </ul>
              <p className="mt-2 mb-1"><strong>20.3 In-Home Services</strong></p>
              <p>
                For services performed at a Customer's residence, additional terms apply:
              </p>
              <p className="mt-2 mb-1"><strong>Service Professionals Must:</strong></p>
              <ul className="list-disc ml-5">
                <li>Respect the Customer's property and privacy</li>
                <li>Work only in areas agreed upon with the Customer</li>
                <li>Clean up work areas after service completion</li>
                <li>Protect floors, furniture, and other property from damage</li>
                <li>Not bring unauthorized persons to the service location</li>
                <li>Not consume alcohol or drugs before or during service</li>
                <li>Leave immediately if asked by the Customer</li>
              </ul>
              <p className="mt-2 mb-1"><strong>Customers Must:</strong></p>
              <ul className="list-disc ml-5">
                <li>Provide a safe working environment</li>
                <li>Secure pets that may interfere with work</li>
                <li>Remove fragile or valuable items from work areas</li>
                <li>Disclose any hazards (mold, asbestos, lead paint, etc.)</li>
                <li>Be present or arrange for an adult representative to be present</li>
                <li>Not interfere with the Service Professional's work</li>
              </ul>
              <p className="mt-2 mb-1"><strong>20.4 Emergency Services</strong></p>
              <p>
                SabiWay is not designed for emergency situations. For urgent issues
                requiring immediate attention (e.g., burst pipes, electrical fires, gas
                leaks):
              </p>
              <ul className="list-disc ml-5">
                <li>Contact emergency services (police, fire, ambulance) first</li>
                <li>Contact specialized emergency service providers</li>
                <li>Do not rely on the Platform for time-sensitive emergencies</li>
              </ul>
              <p>
                While some Service Professionals may offer emergency services, SabiWay
                does not guarantee availability or response times.
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* FEEDBACK AND SUGGESTIONS */}
            <article id="feedback">
              <Heading text={"21. FEEDBACK AND SUGGESTIONS"}/>
              <p className="mt-2 mb-1"><strong>21.1 Voluntary Submissions</strong></p>
              <p>
                We welcome your feedback, suggestions, comments, and ideas for improving
                the Platform ("Feedback"). By submitting Feedback, you agree that:
              </p>
              <ul className="list-disc ml-5">
                <li>Your Feedback is voluntary and unsolicited</li>
                <li>
                  SabiWay is free to use, disclose, reproduce, modify, and distribute the
                  Feedback without compensation or attribution to you
                </li>
                <li>
                  You grant SabiWay a perpetual, irrevocable, worldwide, royalty-free
                  license to use the Feedback for any purpose
                </li>
                <li>
                  Your Feedback does not contain confidential or proprietary information
                  of you or third parties
                </li>
              </ul>
              <p className="mt-2 mb-1"><strong>21.2 No Obligation</strong></p>
              <p>SabiWay is under no obligation to:</p>
              <ul className="list-disc ml-5">
                <li>Review or consider your Feedback</li>
                <li>Implement your suggestions</li>
                <li>Keep your Feedback confidential</li>
                <li>Compensate you for Feedback</li>
              </ul>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
            
            {/* CONTACT INFORMATION */}
            <article id="contact">
              <Heading text={"21. CONTACT INFORMATION"}/>
              <p>
                If you have any questions, concerns, or complaints about these Terms or
                the Platform, please contact us:
              </p>
              <p>General Inquiries:</p>
              <p>Email: info@sabiway.com</p>
              <p>Phone: (123) 456-789</p>
              <p>Customer Support:</p>
              <p>Email: support@sabiway.com</p>
              <p>Hours: Monday - Friday, 8:00 AM - 6:00 PM WAT</p>
              <p>Legal Matters:</p>
              <p>Email: info@sabiway.com</p>
              <p>Safety Concerns:</p>
              <p>Email: info@sabiway.com</p>
              <p>Data Protection:</p>
              <p>Email: info@sabiway.com</p>
              <p>(Data Protection Officer)</p>
              <p>Mailing Address:</p>
              <p>SabiWay LTD</p>
              <p>75, VILLAGE DRIVE, PRESTON,</p>
              <p>PR2 6JH</p>
              <p>We aim to respond to all inquiries within 2-3 business days.</p>
            </article>

            <div className="border-b border-gray-200 mt-5"></div>
            
            {/* ACKNOWLEDGMENT AND ACCEPTANCE */}
            <article id="acknowledgement">
              <Heading text={"22. ACKNOWLEDGMENT AND ACCEPTANCE"}/>
              <p>
                BY CLICKING "I AGREE," CREATING AN ACCOUNT, OR USING THE PLATFORM IN ANY
                WAY, YOU ACKNOWLEDGE THAT:
              </p>
              <ol>
                <li>You have read and understood these Terms of Use in their entirety</li>
                <li>You agree to be bound by these Terms and our Privacy Policy</li>
                <li>
                  You are at least 18 years of age or the age of majority in your
                  jurisdiction
                </li>
                <li>You have the legal capacity to enter into a binding agreement</li>
                <li>
                  If registering on behalf of a business, you have the authority to bind
                  that business to these Terms
                </li>
                <li>
                  You understand that SabiWay is a platform that connects Customers with
                  independent Service Professionals
                </li>
                <li>
                  You understand that SabiWay does not provide services, employ Service
                  Professionals, or guarantee service quality
                </li>
                <li>
                  You accept the risks associated with using the Platform and engaging
                  with other Users
                </li>
                <li>
                  You have reviewed the dispute resolution and arbitration provisions in
                  Section 13
                </li>
                <li>You consent to receive electronic communications from SabiWay</li>
              </ol>
              <p>
                <strong
                  >IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE PLATFORM.</strong
                >
              </p>
            </article>

            <div className="border-b border-gray-200 my-5"></div>
          </section>


        </div>
      </div>
    )
}