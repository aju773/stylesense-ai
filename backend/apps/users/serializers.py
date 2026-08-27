from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.products.models import Product

User = get_user_model()

# Closed vocabulary — see planning/stylesense-ai/issues/11.8-style-profile-backend.md.
# Vibes are interpolated into SYSTEM_PROMPT and folded into the embedded retrieval
# query, so free text here would be a prompt-injection surface. Only strings the
# server itself chose are ever allowed through.
VIBE_CHOICES = ("Minimalist", "Tailored", "Bohemian", "Streetwear", "Monochrome")
SIZE_CHOICES = ("XS", "S", "M", "L", "XL", "XXL")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("email", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class BudgetSerializer(serializers.Serializer):
    min = serializers.IntegerField(min_value=0, required=False)
    max = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs):
        if "min" in attrs and "max" in attrs and attrs["min"] > attrs["max"]:
            raise serializers.ValidationError("min must not be greater than max.")
        return attrs


class StylePreferencesSerializer(serializers.Serializer):
    """Validates the shape of `User.style_preferences`.

    Kept as a plain (non-model) serializer nested inside UserSerializer — the
    field stays JSON on the model, validation lives here, matching how this
    codebase already validates JSON payloads elsewhere.
    """

    vibes = serializers.ListField(
        child=serializers.ChoiceField(choices=VIBE_CHOICES),
        required=False,
        allow_empty=True,
    )
    size = serializers.ChoiceField(choices=SIZE_CHOICES, required=False, allow_null=True)
    budget = BudgetSerializer(required=False)
    gender = serializers.ChoiceField(
        choices=Product.GENDER_CHOICES, required=False, allow_null=True
    )


class UserSerializer(serializers.ModelSerializer):
    style_preferences = StylePreferencesSerializer(required=False)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "style_preferences")
        read_only_fields = ("id", "email")
