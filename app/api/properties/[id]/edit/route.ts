import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { savePropertyImage, deletePropertyImage } from "@/lib/propertyImageStorage";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  PRICE_MIN,
  PRICE_MAX,
  BEDROOMS_MAX,
  BATHROOMS_MAX,
  ACREAGE_MAX,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MIN_LENGTH,
  IMAGE_MAX_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  getPropertyTypeFields,
} from "@/lib/propertyConstants";
import type { User } from "@prisma/client";

const EDITABLE_STATUSES = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.sellerId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own listings." }, { status: 403 });
    }

    if (!EDITABLE_STATUSES.includes(property.status)) {
      return NextResponse.json(
        { error: "This listing has already been approved and can no longer be edited here." },
        { status: 400 }
      );
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
    const clearLocation = str(formData, "clearLocation") === "true";
    const imageFile = formData.get("image");

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

    if (session.user.role === "AGENT" && !representingName) {
      return NextResponse.json(
        { error: "As an agent, you must state who you're representing (the property owner's name)." },
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

    // Which of bedrooms/bathrooms/acreage actually apply to this property type — see
    // lib/propertyConstants.ts. Values submitted for a field that doesn't apply are dropped
    // here rather than trusted from the client.
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

    let parsedLatitude: number | null = null;
    let parsedLongitude: number | null = null;
    if (!clearLocation && (latitudeRaw || longitudeRaw)) {
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

    let validatedImage: File | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      if (imageFile.size > IMAGE_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Image is too large. Max size is ${IMAGE_MAX_SIZE_BYTES / (1024 * 1024)}MB.` },
          { status: 400 }
        );
      }
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.type)) {
        return NextResponse.json({ error: "Image must be a JPEG, PNG, or WEBP file." }, { status: 400 });
      }
      validatedImage = imageFile;
    }

    // A photo is mandatory — if there's neither an existing one nor a new upload here, this
    // listing predates the mandatory-photo rule (or something went wrong client-side) and can't
    // be saved until one is provided.
    if (!validatedImage && !property.imageUrl) {
      return NextResponse.json({ error: "A photo is required for the listing. Please upload one." }, { status: 400 });
    }

    // Editing a listing that was sent back (changes requested or rejected) resubmits it for
    // review — status goes back to PENDING and the admin's note is cleared. Editing a listing
    // that's still plain PENDING (never reviewed yet) doesn't need a re-notify.
    const isResubmission = property.status !== "PENDING";

    let imageUrl = property.imageUrl;
    if (validatedImage) {
      await deletePropertyImage(property.imageUrl);
      imageUrl = await savePropertyImage(validatedImage, property.id);
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
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
        imageUrl,
        status: "PENDING",
        adminNote: null,
        representingName: session.user.role === "AGENT" ? representingName : null,
        representingContact: session.user.role === "AGENT" && representingContact ? representingContact : null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        address: parsedLatitude !== null ? address || null : null,
        placeId: parsedLatitude !== null ? placeId || null : null,
      },
    });

    if (isResubmission) {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin: User) => ({
            message: `${session.user.name || session.user.email} updated and resubmitted "${title}" for review.`,
            senderId: session.user.id,
            receiverId: admin.id,
            propertyId: updated.id,
          })),
        });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
