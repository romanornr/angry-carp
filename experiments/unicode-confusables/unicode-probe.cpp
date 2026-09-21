#include <unicode/normalizer2.h>
#include <unicode/uchar.h>
#include <unicode/unistr.h>
#include <unicode/uspoof.h>
#include <unicode/uversion.h>

#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

struct Sample {
    const char* name;
    const char* reference;
    const char* candidate;
};

void check(UErrorCode status) {
    if (U_FAILURE(status)) throw std::runtime_error(u_errorName(status));
}

std::string utf8(const icu::UnicodeString& value) {
    std::string result;
    value.toUTF8String(result);
    return result;
}

int main() {
    UVersionInfo version;
    char version_text[U_MAX_VERSION_STRING_LENGTH];
    u_getUnicodeVersion(version);
    u_versionToString(version, version_text);
    std::cerr << "ICU " << U_ICU_VERSION << "; Unicode " << version_text << '\n';

    UErrorCode status = U_ZERO_ERROR;
    USpoofChecker* checker = uspoof_open(&status);
    check(status);
    uspoof_setRestrictionLevel(checker, USPOOF_HIGHLY_RESTRICTIVE);
    uspoof_setChecks(checker, USPOOF_CONFUSABLE | USPOOF_RESTRICTION_LEVEL |
                                USPOOF_INVISIBLE | USPOOF_MIXED_NUMBERS, &status);
    check(status);
    const auto* normalizer = icu::Normalizer2::getNFKCCasefoldInstance(status);
    check(status);

    const std::vector<Sample> samples = {
        {"identical_ascii", "paypal", "paypal"},
        {"mixed_cyrillic", "paypal", "p\u0430yp\u0430l"},
        {"dhl_lookalike", "DHL", "\u13a0\u041d\u13de"},
        {"whole_cyrillic", "scope", "\u0455\u0441\u043e\u0440\u0435"},
        {"ascii_visual_collision", "m", "rn"},
        {"accented_name", "cafe", "caf\u00e9"},
        {"japanese_latin_name", "DHL", "\u30e1\u30fc\u30ebDHL"},
        {"unrelated_sender", "DHL", "Invoice Team"},
        {"zero_width_insert", "paypal", "pay\u200bpal"},
        {"fullwidth", "DHL", "\uff24\uff28\uff2c"},
        {"case_difference", "DHL", "dhl"},
        {"mixed_digit_systems", "12", "1\u0662"},
        {"bidi_control", "paypal", "pay\u202epal\u202c"},
    };

    std::cout << "sample\treference\tcandidate\tnfkc_casefold_equal\t"
                 "skeleton_equal\tltr_bidi_skeleton_equal\tpair_flags\t"
                 "candidate_check_flags\thas_default_ignorable\thas_bidi_control\n";
    for (const auto& sample : samples) {
        auto reference = icu::UnicodeString::fromUTF8(sample.reference);
        auto candidate = icu::UnicodeString::fromUTF8(sample.candidate);
        icu::UnicodeString reference_skeleton, candidate_skeleton;
        icu::UnicodeString reference_bidi_skeleton, candidate_bidi_skeleton;
        icu::UnicodeString reference_normalized, candidate_normalized;
        uspoof_getSkeletonUnicodeString(checker, 0, reference, reference_skeleton, &status);
        uspoof_getSkeletonUnicodeString(checker, 0, candidate, candidate_skeleton, &status);
        uspoof_getBidiSkeletonUnicodeString(checker, UBIDI_LTR, reference, reference_bidi_skeleton, &status);
        uspoof_getBidiSkeletonUnicodeString(checker, UBIDI_LTR, candidate, candidate_bidi_skeleton, &status);
        normalizer->normalize(reference, reference_normalized, status);
        normalizer->normalize(candidate, candidate_normalized, status);
        const int pair_flags = uspoof_areConfusableUnicodeString(checker, reference, candidate, &status);
        const int candidate_flags = uspoof_checkUnicodeString(checker, candidate, nullptr, &status);
        check(status);
        bool has_default_ignorable = false;
        bool has_bidi_control = false;
        for (int32_t offset = 0; offset < candidate.length();) {
            const UChar32 cp = candidate.char32At(offset);
            has_default_ignorable |= u_hasBinaryProperty(cp, UCHAR_DEFAULT_IGNORABLE_CODE_POINT);
            has_bidi_control |= u_hasBinaryProperty(cp, UCHAR_BIDI_CONTROL);
            offset += U16_LENGTH(cp);
        }
        std::cout << sample.name << '\t' << utf8(reference) << '\t' << utf8(candidate)
                  << '\t' << (reference_normalized == candidate_normalized)
                  << '\t' << (reference_skeleton == candidate_skeleton)
                  << '\t' << (reference_bidi_skeleton == candidate_bidi_skeleton)
                  << '\t' << pair_flags << '\t' << candidate_flags
                  << '\t' << has_default_ignorable << '\t' << has_bidi_control << '\n';
    }
    uspoof_close(checker);
}
