import type { Prisma } from "@prisma/client";

export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    company: true;
    campaign: true;
    batch: true;
    contacts: true;
    primaryContact: true;
    events: {
      orderBy: {
        occurredAt: "desc";
      };
      take: 10;
    };
  };
}>;

export type SessionWithLeadRelations = Prisma.SessionGetPayload<{
  include: {
    leads: {
      include: {
        company: true;
        campaign: true;
        batch: true;
        contacts: true;
        primaryContact: true;
        events: {
          orderBy: {
            occurredAt: "desc";
          };
          take: 10;
        };
      };
    };
  };
}>;
