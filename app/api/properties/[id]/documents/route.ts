import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import {
  DOCUMENT_TYPES,
  MAX_FILES_PER_UPLOAD,
  MAX_FILE_SIZE_BYTES,
  isAllowedFileType,
  randomStoredName,
  saveDocument,
} from "@/lib/documentStorage";
import { recomputeDaktopVerified } from "@/lib/verificationStatus";

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
      return NextResponse.json(
        { error: "You can only upload documents for your own listings." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    const documentTypeRaw = formData.get("documentType");
    const documentType =
      typeof documentTypeRaw === "string" && DOCUMENT_TYPES.includes(documentTypeRaw as any)
        ? documentTypeRaw
        : null;

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one file to upload." }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `You can upload at most ${MAX_FILES_PER_UPLOAD} files at once.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" is too large. Max size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB per file.` },
          { status: 400 }
        );
      }
      if (!isAllowedFileType(file.type)) {
        return NextResponse.json(
          { error: `"${file.name}" is not an allowed file type. Use PDF, JPG, PNG, WEBP, DOC, or DOCX.` },
          { status: 400 }
        );
      }
    }

    const created = [];
    for (const file of files) {
      const storedName = randomStoredName(file.name);
      await saveDocument(file, property.id, storedName);

      const doc = await prisma.propertyDocument.create({
        data: {
          propertyId: property.id,
          uploadedById: session.user.id,
          documentType,
          fileName: file.name,
          storedName,
          mimeType: file.type || null,
          fileSize: file.size,
        },
      });
      created.push(doc);
    }

    // A newly-uploaded document is unverified by definition, so a listing that was previously
    // fully verified loses the DAKTOP VERIFIED badge until this one is checked too.
    await recomputeDaktopVerified(property.id);

    return NextResponse.json({ documents: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
