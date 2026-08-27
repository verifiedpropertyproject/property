import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { savePropertyImage, savePropertyVideo } from "@/lib/propertyImageStorage";
import { generateCommissionCertificatePdf } from "@/lib/commissionCertificate";
import { saveCommissionCertificate } from "@/lib/commissionCertificateStorage";
import { submitIdentityVerificationRequest } from "@/lib/identityVerificationRequest";
import { notifyUsers } from "@/lib/notify";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  PRICE_MIN,
  PRICE_MAX,
  SALE_PRICE_MIN,
  BEDROOMS_MAX,
  BATHROOMS_MAX,
  ACREAGE_MAX,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MIN_LENGTH,
  IMAGE_MAX_SIZE_BYTES,
  MAX_GALLERY_IMAGES,
  ALLOWED_IMAGE_MIME_TYPES,
  VIDEO_MAX_SIZE_BYTES,
  ALLOWED_VIDEO_MIME_TYPES,
  DEFAULT_COMMISSION_RATE,
  COMMISSION_AGREEMENT_VERSION,
  commissionAgreementText,
  getPropertyTypeFields,
} from "@/lib/propertyConstants";
import type { User } from "@prisma/client";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!["OWNER", "AGENT"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Only property owners and agents can list properties." }, { status: 403 });
    }

    const formData = await req.formData();

    const title = str(formData, "title");
    const description = str(formData, "description");
    const location = str(formData, "location");
    const propertyType = str(formData, "propertyType");
    const propertyTypeOther = str(formData, "propertyTypeOther");
    const listingType = str(formData, "listingType");
    const priceRaw = str(formData, "price");
    const bedroomsRaw = str(formData, "bedrooms");
    const bathroomsRaw = str(formData, "bathrooms");
    const acreageRaw = str(formData, "acreage");
    const representingName = str(formData, "representingName");
    const representingContact = str(formData, "representingContact");
    const latitudeRaw = str(formData, "latitude");
    const longitudeRaw = str(formData, "longitude");
    const address = str(formData, "address");
    const placeId = str(formData, "placeId");
    const commissionAgreed = str(formData, "commissionAgreed") === "true";
    const signedName = str(formData, "signedName");
    const imageFile = formData.get("image");
    const galleryFiles = formData.getAll("galleryImages").filter((f): f is File => f instanceof File && f.size > 0);
    // Optional — a listing can be created without a video and one can be added later from the
    // edit page (see PropertyVideoManager / app/api/properties/[id]/video).
    const videoFileRaw = formData.get("video");
    const videoFile = videoFileRaw instanceof File && videoFileRaw.size > 0 ? videoFileRaw : null;

    if (!title || !description || !location || !propertyType || !listingType || !priceRaw) {
      return NextResponse.json(
        { error: "Title, description, location, property type, listing type, and price are required." },
        { status: 400 }
      );
    }

    if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (description.length < DESCRIPTION_MIN_LENGTH || description.length > DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        {
          error: `Description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters — give buyers enough to go on.`,
        },
        { status: 400 }
      );
    }

    if (location.length < LOCATION_MIN_LENGTH) {
      return NextResponse.json({ error: `Location must be at least ${LOCATION_MIN_LENGTH} characters.` }, { status: 400 });
    }

    if (!(PROPERTY_TYPES as readonly string[]).includes(propertyType)) {
      return NextResponse.json({ error: "Invalid property type." }, { status: 400 });
    }

    if (propertyType === "OTHER" && !propertyTypeOther) {
      return NextResponse.json(
        { error: "Since you selected \"Other\", please specify what type of property it is." },
        { status: 400 }
      );
    }

    if (!(LISTING_TYPES as readonly string[]).includes(listingType)) {
      return NextResponse.json({ error: "Invalid listing type." }, { status: 400 });
    }

    // Agents are selling on someone else's behalf, so they must say who that is.
    if (session.user.role === "AGENT" && !representingName) {
      return NextResponse.json(
        { error: "As an agent, you must state who you're representing (the property owner's name)." },
        { status: 400 }
      );
    }

    if (!commissionAgreed) {
      return NextResponse.json(
        { error: "You must agree to the platform's commission terms to list a property." },
        { status: 400 }
      );
    }

    if (signedName.length < 2) {
      return NextResponse.json(
        { error: "Please type your full legal name to sign the commission agreement." },
        { status: 400 }
      );
    }

    const parsedPrice = Number(priceRaw);
    if (Number.isNaN(parsedPrice) || parsedPrice < PRICE_MIN || parsedPrice > PRICE_MAX) {
      return NextResponse.json(
        { error: `Price must be between KSh ${PRICE_MIN.toLocaleString()} and KSh ${PRICE_MAX.toLocaleString()}.` },
        { status: 400 }
      );
    }

    // DAKTOP360 is a premium marketplace — this floor is enforced server side (not just
    // hinted in the form) and applies only to sale listings, not rentals.
    if (listingType === "SALE" && parsedPrice < SALE_PRICE_MIN) {
      return NextResponse.json(
        { error: `Properties for sale must be priced at KSh ${SALE_PRICE_MIN.toLocaleString()} or above.` },
        { status: 400 }
      );
    }

    // Which of bedrooms/bathrooms/acreage actually apply to this property type — the single
    // source of truth shared with the form. Values submitted for a field that doesn't apply
    // (e.g. "bedrooms" on a LAND listing) are dropped here rather than trusted from the
    // client, since a hand-crafted request could otherwise bypass what the form hides.
    const typeFields = getPropertyTypeFields(propertyType);

    const parsedBedrooms = typeFields.bedrooms && bedroomsRaw ? Number(bedroomsRaw) : null;
    const parsedBathrooms = typeFields.bathrooms && bathroomsRaw ? Number(bathroomsRaw) : null;
    const parsedAcreage = typeFields.acreage && acreageRaw ? Number(acreageRaw) : null;

    if (parsedBedrooms !== null && (Number.isNaN(parsedBedrooms) || parsedBedrooms < 0 || parsedBedrooms > BEDROOMS_MAX)) {
      return NextResponse.json({ error: `Bedrooms must be between 0 and ${BEDROOMS_MAX}.` }, { status: 400 });
    }
    if (
      parsedBathrooms !== null &&
      (Number.isNaN(parsedBathrooms) || parsedBathrooms < 0 || parsedBathrooms > BATHROOMS_MAX)
    ) {
      return NextResponse.json({ error: `Bathrooms must be between 0 and ${BATHROOMS_MAX}.` }, { status: 400 });
    }
    if (parsedAcreage !== null && (Number.isNaN(parsedAcreage) || parsedAcreage <= 0 || parsedAcreage > ACREAGE_MAX)) {
      return NextResponse.json({ error: `Acreage must be greater than 0 and at most ${ACREAGE_MAX}.` }, { status: 400 });
    }
    if (typeFields.acreageRequired && parsedAcreage === null) {
      return NextResponse.json({ error: `${typeFields.acreageLabel} is required for a land listing.` }, { status: 400 });
    }

    // The map pin is optional, but if either coordinate is present both must be, and both
    // must be real-world values.
    let parsedLatitude: number | null = null;
    let parsedLongitude: number | null = null;
    if (latitudeRaw || longitudeRaw) {
      parsedLatitude = Number(latitudeRaw);
      parsedLongitude = Number(longitudeRaw);
      if (
        Number.isNaN(parsedLatitude) ||
        Number.isNaN(parsedLongitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90 ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
      ) {
        return NextResponse.json({ error: "Invalid map pin coordinates." }, { status: 400 });
      }
    }

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return NextResponse.json({ error: "A photo is required for the listing." }, { status: 400 });
    }
    if (imageFile.size > IMAGE_MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Image is too large. Max size is ${IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.type)) {
      return NextResponse.json({ error: "Image must be a JPEG, PNG, or WEBP file." }, { status: 400 });
    }

    if (galleryFiles.length > MAX_GALLERY_IMAGES) {
      return NextResponse.json(
        { error: `You can upload at most ${MAX_GALLERY_IMAGES} additional photos.` },
        { status: 400 }
      );
    }
    for (const file of galleryFiles) {
      if (file.size > IMAGE_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Each additional photo must be under ${IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Additional photos must be JPEG, PNG, or WEBP files." }, { status: 400 });
      }
    }

    if (videoFile) {
      if (videoFile.size > VIDEO_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Video is too large. Max size is ${Math.round(VIDEO_MAX_SIZE_BYTES / (1024 * 1024))}MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_VIDEO_MIME_TYPES.includes(videoFile.type)) {
        return NextResponse.json({ error: "Video must be an MP4, WebM, or MOV file." }, { status: 400 });
      }
    }

    // Best-effort — proxies/load balancers set these, but neither is guaranteed present.
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent");

    const property = await prisma.property.create({
      data: {
        title,
        description,
        location,
        propertyType,
        propertyTypeOther: propertyType === "OTHER" ? propertyTypeOther : null,
        listingType,
        price: parsedPrice,
        bedrooms: parsedBedrooms,
        bathrooms: parsedBathrooms,
        acreage: parsedAcreage,
        status: "PENDING",
        sellerId: session.user.id,
        // Only meaningful for agent listings — left null for owner listings.
        representingName: session.user.role === "AGENT" ? representingName : null,
        representingContact: session.user.role === "AGENT" && representingContact ? representingContact : null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        address: parsedLatitude !== null ? address || null : null,
        placeId: parsedLatitude !== null ? placeId || null : null,
        // Rate + text are generated here, not taken from the client, so the legal snapshot
        // can't be tampered with — the checkbox just confirms consent to what we generate.
        commissionRate: DEFAULT_COMMISSION_RATE,
        commissionAgreedAt: new Date(),
        commissionAgreementText: commissionAgreementText(DEFAULT_COMMISSION_RATE),
      },
    });

    const imageUrl = await savePropertyImage(imageFile, property.id);
    await prisma.property.update({ where: { id: property.id }, data: { imageUrl } });
    property.imageUrl = imageUrl;

    if (galleryFiles.length > 0) {
      const galleryUrls = await Promise.all(galleryFiles.map((file) => savePropertyImage(file, property.id)));
      await prisma.propertyImage.createMany({
        data: galleryUrls.map((url) => ({ url, propertyId: property.id })),
      });
    }

    if (videoFile) {
      const videoUrl = await savePropertyVideo(videoFile, property.id);
      await prisma.property.update({ where: { id: property.id }, data: { videoUrl } });
      property.videoUrl = videoUrl;
    }

    // Optional "also request identity verification" checkbox — best-effort side effect, never
    // blocks or fails listing creation if the requester isn't currently eligible to request.
    if (str(formData, "requestIdentityVerification") === "true") {
      const requestingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (requestingUser) {
        await submitIdentityVerificationRequest(requestingUser);
      }
    }

    // Full audit-trail row for this signing — separate from the denormalized
    // commissionRate/commissionAgreedAt/commissionAgreementText cache on Property itself, and
    // never overwritten afterward (an admin changing Property.commissionRate later doesn't
    // touch this).
    const agreement = await prisma.commissionAgreement.create({
      data: {
        userId: session.user.id,
        propertyId: property.id,
        rate: DEFAULT_COMMISSION_RATE,
        agreementVersion: COMMISSION_AGREEMENT_VERSION,
        agreementText: commissionAgreementText(DEFAULT_COMMISSION_RATE),
        signedName,
        ipAddress,
        userAgent,
      },
    });

    try {
      const pdfBytes = await generateCommissionCertificatePdf({
        agreementId: agreement.id,
        propertyId: property.id,
        propertyTitle: title,
        sellerName: session.user.name ?? null,
        sellerEmail: session.user.email || "(email not on file)",
        signedName,
        rate: DEFAULT_COMMISSION_RATE,
        agreementVersion: COMMISSION_AGREEMENT_VERSION,
        agreementText: agreement.agreementText,
        signedAt: agreement.signedAt,
        ipAddress,
        userAgent,
      });
      const certificateKey = await saveCommissionCertificate(pdfBytes, property.id, agreement.id);
      await prisma.commissionAgreement.update({ where: { id: agreement.id }, data: { certificateUrl: certificateKey } });
    } catch (certErr) {
      // Non-fatal: the signed record itself (name/IP/timestamp/text) is already saved in the
      // database either way — the PDF is a convenience artifact, not the source of truth.
      console.error("Failed to generate/store commission certificate:", certErr);
    }

    // Notify every admin that a new property needs review
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

    if (admins.length > 0) {
      await notifyUsers(
        admins.map((admin: User) => ({
          senderId: session.user.id,
          receiverId: admin.id,
          message: `${session.user.name || session.user.email} listed a new property for review: "${title}"`,
          propertyId: property.id,
          emailSubject: "New listing needs review",
        }))
      );
    }

    return NextResponse.json(property, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
